import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SimulationHardwareGateway } from './simulatorAdapter';
import { HardwareCommandEnvelope } from './domain';

describe('Hardware Gateway Contract', () => {
  let gateway: SimulationHardwareGateway;

  beforeEach(() => {
    gateway = new SimulationHardwareGateway();
  });

  it('1. Enforces initial DISCONNECTED state and rejects commands', () => {
    assert.strictEqual(gateway.getConnectionStatus(), 'DISCONNECTED');
    let rejectedAck = false;
    gateway.onAckReceived(ack => {
      if (ack.status === 'REJECTED' && ack.reason === 'Hardware disconnected') {
        rejectedAck = true;
      }
    });
    
    gateway.sendCommand({
      commandId: 'cmd-1',
      timestamp: new Date().toISOString(),
      robotId: 'ROBO-1',
      type: 'LOCOMOTION',
      parameters: { x: 1, y: 0 },
      protocolVersion: '1.0.0'
    });
    assert.ok(rejectedAck);
  });

  it('2. Emits CONNECTED on successful connection', async () => {
    let connectedEmitted = false;
    gateway.onConnectionChanged(state => {
      if (state === 'CONNECTED') connectedEmitted = true;
    });
    await gateway.connect();
    assert.ok(connectedEmitted);
    assert.strictEqual(gateway.getConnectionStatus(), 'CONNECTED');
  });

  it('3. Respects command idempotency (rejects duplicates)', async () => {
    await gateway.connect();
    const command: HardwareCommandEnvelope = {
      commandId: 'cmd-idempotency',
      timestamp: new Date().toISOString(),
      robotId: 'ROBO-1',
      type: 'ARM_X',
      parameters: { val: 5 },
      protocolVersion: '1.0.0'
    };

    let receivedCount = 0;
    let rejectedCount = 0;
    gateway.onAckReceived(ack => {
      if (ack.commandId === 'cmd-idempotency') {
        if (ack.status === 'RECEIVED') receivedCount++;
        if (ack.status === 'REJECTED') rejectedCount++;
      }
    });

    gateway.sendCommand(command);
    gateway.sendCommand(command); // duplicate

    assert.strictEqual(receivedCount, 1);
    assert.strictEqual(rejectedCount, 1);
  });

  it('4. Follows normal command lifecycle (RECEIVED -> ACCEPTED -> EXECUTING -> ACKNOWLEDGED)', async () => {
    await gateway.connect();
    const acks: string[] = [];
    gateway.onAckReceived(ack => {
      if (ack.commandId === 'cmd-normal') {
        acks.push(ack.status);
      }
    });

    gateway.sendCommand({
      commandId: 'cmd-normal',
      timestamp: new Date().toISOString(),
      robotId: 'ROBO-1',
      type: 'LOCOMOTION',
      parameters: { x: 1 },
      protocolVersion: '1.0.0'
    });

    await new Promise(r => setTimeout(r, 500));
    assert.deepStrictEqual(acks, ['RECEIVED', 'ACCEPTED', 'EXECUTING', 'ACKNOWLEDGED']);
  });

  it('5. Follows hardware rejection lifecycle (RECEIVED -> REJECTED)', async () => {
    await gateway.connect();
    const acks: string[] = [];
    gateway.onAckReceived(ack => {
      if (ack.commandId === 'cmd-reject') {
        acks.push(ack.status);
      }
    });

    gateway.sendCommand({
      commandId: 'cmd-reject',
      timestamp: new Date().toISOString(),
      robotId: 'ROBO-1',
      type: 'REJECTION_TEST',
      parameters: {},
      protocolVersion: '1.0.0'
    });

    await new Promise(r => setTimeout(r, 500));
    assert.deepStrictEqual(acks, ['RECEIVED', 'REJECTED']);
  });

  it('6. Follows execution failure lifecycle (RECEIVED -> ACCEPTED -> EXECUTING -> FAILED)', async () => {
    await gateway.connect();
    const acks: string[] = [];
    gateway.onAckReceived(ack => {
      if (ack.commandId === 'cmd-fail') {
        acks.push(ack.status);
      }
    });

    gateway.sendCommand({
      commandId: 'cmd-fail',
      timestamp: new Date().toISOString(),
      robotId: 'ROBO-1',
      type: 'FAILURE_TEST',
      parameters: {},
      protocolVersion: '1.0.0'
    });

    await new Promise(r => setTimeout(r, 500));
    assert.deepStrictEqual(acks, ['RECEIVED', 'ACCEPTED', 'EXECUTING', 'FAILED']);
  });

  it('7. Follows timeout lifecycle (RECEIVED -> ACCEPTED -> EXECUTING -> TIMED_OUT)', async () => {
    await gateway.connect();
    const acks: string[] = [];
    gateway.onAckReceived(ack => {
      if (ack.commandId === 'cmd-timeout') {
        acks.push(ack.status);
      }
    });

    gateway.sendCommand({
      commandId: 'cmd-timeout',
      timestamp: new Date().toISOString(),
      robotId: 'ROBO-1',
      type: 'TIMEOUT_TEST',
      parameters: {},
      protocolVersion: '1.0.0'
    });

    await new Promise(r => setTimeout(r, 500));
    assert.deepStrictEqual(acks, ['RECEIVED', 'ACCEPTED', 'EXECUTING', 'TIMED_OUT']);
  });

  it('8. Supports physical hardware E-Stop reporting distinct from software', async () => {
    await gateway.connect();
    let estopReason = '';
    gateway.onHardwareEmergencyStop(reason => {
      estopReason = reason;
    });

    gateway.triggerPhysicalHardwareEStopSimulation();
    assert.strictEqual(estopReason, 'PHYSICAL_BUTTON_PRESSED');
    assert.strictEqual(gateway.getConnectionStatus(), 'STOPPED');
  });
});
