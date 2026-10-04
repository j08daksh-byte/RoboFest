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

  it('4. Follows ACK lifecycle (RECEIVED -> ACKNOWLEDGED)', async () => {
    await gateway.connect();
    const acks: string[] = [];
    gateway.onAckReceived(ack => {
      if (ack.commandId === 'cmd-lifecycle') {
        acks.push(ack.status);
      }
    });

    gateway.sendCommand({
      commandId: 'cmd-lifecycle',
      timestamp: new Date().toISOString(),
      robotId: 'ROBO-1',
      type: 'TORCH',
      parameters: { enable: true },
      protocolVersion: '1.0.0'
    });

    // wait for async timeout inside simulator
    await new Promise(r => setTimeout(r, 50));
    assert.deepStrictEqual(acks, ['RECEIVED', 'ACKNOWLEDGED']);
  });

  it('5. Transitions to TIMED_OUT when hardware execution hangs', async () => {
    await gateway.connect();
    let timedOut = false;
    gateway.onAckReceived(ack => {
      if (ack.commandId === 'cmd-timeout' && ack.status === 'TIMED_OUT') {
        timedOut = true;
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

    await new Promise(r => setTimeout(r, 50));
    assert.ok(timedOut);
  });

  it('6. Supports physical hardware E-Stop reporting distinct from software', async () => {
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
