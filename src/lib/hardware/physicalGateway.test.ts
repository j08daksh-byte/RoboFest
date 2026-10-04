import test from 'node:test';
import assert from 'node:assert';
import { PhysicalHardwareGateway } from './physicalGateway';
import { MockHardwareTransport } from './transport/mockTransport';
import { Esp32ProtocolAdapter } from './protocol/adapter';
import { HardwareCommandEnvelope, HardwareAckEnvelope, HardwareTelemetryEnvelope } from './domain';
import { ESP32_PROTOCOL_VERSION } from './protocol/domain';

test('PhysicalHardwareGateway', async (t) => {
  let transport: MockHardwareTransport;
  let adapter: Esp32ProtocolAdapter;
  let gateway: PhysicalHardwareGateway;

  t.beforeEach(() => {
    transport = new MockHardwareTransport();
    adapter = new Esp32ProtocolAdapter();
    gateway = new PhysicalHardwareGateway(transport, adapter);
  });

  await t.test('1. connect state is accurately reflected', async () => {
    assert.strictEqual(gateway.getConnectionStatus(), 'DISCONNECTED');
    await gateway.connect();
    assert.strictEqual(gateway.getConnectionStatus(), 'CONNECTED');
  });

  await t.test('2. disconnect state is accurately reflected', async () => {
    await gateway.connect();
    await gateway.disconnect();
    assert.strictEqual(gateway.getConnectionStatus(), 'DISCONNECTED');
  });

  await t.test('3. connection failure transitions to FAULT', async () => {
    transport.shouldFailConnect = true;
    await assert.rejects(gateway.connect(), /failure/);
    assert.strictEqual(gateway.getConnectionStatus(), 'FAULT');
  });

  await t.test('4. valid command transmission', async () => {
    await gateway.connect();
    
    const cmd: HardwareCommandEnvelope = {
      commandId: 'test-123',
      timestamp: new Date().toISOString(),
      robotId: 'rob-1',
      type: 'LOCOMOTION',
      parameters: { x: 10, y: 10 },
      protocolVersion: ESP32_PROTOCOL_VERSION
    };

    gateway.sendCommand(cmd);
    
    assert.strictEqual(transport.sentMessages.length, 1);
    const sent = JSON.parse(transport.sentMessages[0]);
    assert.strictEqual(sent.commandId, 'test-123');
    assert.strictEqual(sent.messageType, 'COMMAND');
  });

  await t.test('5. valid ACK reception maps to callback', async () => {
    await gateway.connect();
    
    const cmd: HardwareCommandEnvelope = {
      commandId: 'cmd-ack-1',
      timestamp: new Date().toISOString(),
      robotId: 'rob-1',
      type: 'LOCOMOTION',
      parameters: { x: 10, y: 10 },
      protocolVersion: ESP32_PROTOCOL_VERSION
    };
    gateway.sendCommand(cmd); // registers pending command

    let receivedAck: HardwareAckEnvelope | null = null;
    gateway.onAckReceived((ack) => {
      receivedAck = ack;
    });

    const ackPayload = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'COMMAND_ACK',
      messageId: 'ack-1',
      robotId: 'rob-1',
      timestamp: new Date().toISOString(),
      commandId: 'cmd-ack-1',
      status: 'ACCEPTED'
    });

    transport.simulateIncomingFrame(ackPayload);
    
    assert.ok(receivedAck);
    const ack = receivedAck as HardwareAckEnvelope;
    assert.strictEqual(ack.commandId, 'cmd-ack-1');
    assert.strictEqual(ack.status, 'ACCEPTED');
  });

  await t.test('6. unknown command ACK rejection', async () => {
    await gateway.connect();
    
    let receivedAck: HardwareAckEnvelope | null = null;
    gateway.onAckReceived((ack) => {
      receivedAck = ack;
    });

    const unknownAckPayload = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'COMMAND_ACK',
      messageId: 'ack-2',
      robotId: 'rob-1',
      timestamp: new Date().toISOString(),
      commandId: 'unknown-cmd',
      status: 'ACCEPTED'
    });

    transport.simulateIncomingFrame(unknownAckPayload);
    
    // The gateway drops the ACK for unknown commands, so handler is never called
    assert.strictEqual(receivedAck, null);
  });

  await t.test('7. protocol version mismatch handled gracefully', async () => {
    await gateway.connect();
    
    // Gateway drops malformed/invalid protocol packets safely without crashing
    const badVersionPayload = JSON.stringify({
      protocolVersion: '9.9.9',
      messageType: 'TELEMETRY',
      messageId: 'msg-1',
      robotId: 'rob-1',
      timestamp: new Date().toISOString(),
      sequence: 1
    });

    assert.doesNotThrow(() => {
      transport.simulateIncomingFrame(badVersionPayload);
    });
  });

  await t.test('8. oversized message rejection simulation', async () => {
    await gateway.connect();
    
    let receivedAck: HardwareAckEnvelope | null = null;
    gateway.onAckReceived((ack) => { receivedAck = ack; });
    
    // The MockHardwareTransport simulateIncomingFrame drops messages > 4096 explicitly
    const oversizedPayload = 'A'.repeat(5000);
    transport.simulateIncomingFrame(oversizedPayload);

    assert.strictEqual(receivedAck, null);
  });

  await t.test('9. telemetry reception', async () => {
    await gateway.connect();
    
    let receivedTelemetry: HardwareTelemetryEnvelope | null = null;
    gateway.onTelemetryReceived((tel) => {
      receivedTelemetry = tel;
    });

    const telPayload = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'TELEMETRY',
      messageId: 't-1',
      robotId: 'rob-1',
      timestamp: new Date().toISOString(),
      sequence: 1,
      power: { batteryVoltage: 12.5, currentDraw: 1.2 }
    });

    transport.simulateIncomingFrame(telPayload);
    
    assert.ok(receivedTelemetry);
    const tel = receivedTelemetry as HardwareTelemetryEnvelope;
    assert.strictEqual(tel.source, 'HARDWARE');
    assert.strictEqual(tel.mode, 'LIVE');
    assert.strictEqual(tel.sensors.voltage, 12.5);
  });

  await t.test('10. hardware E-stop message propagation boundary', async () => {
    await gateway.connect();
    
    let estopReason: string | null = null;
    gateway.onHardwareEmergencyStop((reason) => {
      estopReason = reason;
    });

    const estopPayload = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'EMERGENCY_STOP',
      messageId: 'e-1',
      robotId: 'rob-1',
      timestamp: new Date().toISOString(),
      triggerSource: 'PHYSICAL_BUTTON'
    });

    transport.simulateIncomingFrame(estopPayload);
    
    assert.strictEqual(estopReason, 'PHYSICAL_BUTTON');
  });
});
