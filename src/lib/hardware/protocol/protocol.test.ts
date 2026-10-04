import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Esp32ProtocolAdapter } from './adapter';
import { ESP32_PROTOCOL_VERSION, Esp32TelemetryMessage, Esp32HeartbeatMessage, Esp32CommandAckMessage, Esp32EmergencyStopMessage, Esp32FaultMessage } from './domain';
import { HardwareCommandEnvelope } from '../domain';

describe('ESP32 Protocol Adapter', () => {
  const adapter = new Esp32ProtocolAdapter();
  const robotId = 'robofest-6-unit-1';

  it('1. Encodes a valid LOCOMOTION command properly', () => {
    const cmd: HardwareCommandEnvelope = {
      commandId: 'test-cmd-1',
      robotId,
      type: 'LOCOMOTION',
      parameters: { x: 10, y: 20 },
      timestamp: new Date().toISOString(),
      protocolVersion: '1.0.0'
    };

    const payload = adapter.encodeCommand(cmd);
    const decoded = JSON.parse(payload);

    assert.strictEqual(decoded.protocolVersion, ESP32_PROTOCOL_VERSION);
    assert.strictEqual(decoded.messageType, 'COMMAND');
    assert.strictEqual(decoded.commandId, 'test-cmd-1');
    assert.strictEqual(decoded.commandType, 'LOCOMOTION');
    assert.strictEqual(decoded.robotId, robotId);
    assert.deepStrictEqual(decoded.parameters, { x: 10, y: 20 });
    assert.ok(decoded.messageId);
  });

  it('2. Rejects encoding unsupported command types', () => {
    const cmd: HardwareCommandEnvelope = {
      commandId: 'test-cmd-2',
      robotId,
      type: 'UNKNOWN_MAGIC' as unknown as 'LOCOMOTION',
      parameters: {},
      timestamp: new Date().toISOString(),
      protocolVersion: '1.0.0'
    };

    assert.throws(() => adapter.encodeCommand(cmd), /Unsupported command type/);
  });

  it('3. Parses valid ACK message correctly', () => {
    const rawAck = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'COMMAND_ACK',
      messageId: 'ack-123',
      robotId,
      timestamp: new Date().toISOString(),
      commandId: 'cmd-1',
      status: 'ACCEPTED'
    });

    const msg = adapter.parseIncomingMessage(rawAck);
    assert.ok(adapter.isAck(msg));
    if (adapter.isAck(msg)) {
      assert.strictEqual(msg.status, 'ACCEPTED');
      assert.strictEqual(msg.commandId, 'cmd-1');
    }
  });

  it('4. Rejects parsing mismatched protocol versions', () => {
    const rawAck = JSON.stringify({
      protocolVersion: '0.9.0', // Mismatch!
      messageType: 'COMMAND_ACK',
      messageId: 'ack-123',
      robotId,
      timestamp: new Date().toISOString(),
      commandId: 'cmd-1',
      status: 'ACCEPTED'
    });

    assert.throws(() => adapter.parseIncomingMessage(rawAck), /Protocol version mismatch/);
  });

  it('5. Rejects parsing malformed JSON', () => {
    assert.throws(() => adapter.parseIncomingMessage('{ bad json }'), /Malformed JSON/);
  });

  it('6. Rejects missing base fields', () => {
    const raw = JSON.stringify({
      messageType: 'HEARTBEAT',
      // missing protocolVersion
    });
    assert.throws(() => adapter.parseIncomingMessage(raw), /Missing base protocol fields/);
  });

  it('7. Parses valid Telemetry envelope', () => {
    const rawTel = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'TELEMETRY',
      messageId: 'tel-123',
      robotId,
      timestamp: new Date().toISOString(),
      sequence: 1,
      source: 'HARDWARE',
      mode: 'LIVE',
      position: { x: 1, y: 2, theta: 0 },
      armState: { x: 0, y: 0 },
      torchState: { enabled: false },
      electromagnetState: { enabled: true },
      motionState: { moving: false, velocity: 0 },
      power: { batteryVoltage: 12.1, currentDraw: 1.5 },
      temperature: { motorTemp: 35, ambientTemp: 22 },
      emergencyState: { active: false },
      faults: []
    });

    const msg = adapter.parseIncomingMessage(rawTel);
    assert.ok(adapter.isTelemetry(msg));
    if (adapter.isTelemetry(msg)) {
      assert.strictEqual(msg.source, 'HARDWARE');
      assert.strictEqual(msg.mode, 'LIVE');
      assert.strictEqual(msg.power.batteryVoltage, 12.1);
    }
  });

  it('8. Parses valid Heartbeat envelope', () => {
    const rawHb = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'HEARTBEAT',
      messageId: 'hb-123',
      robotId,
      timestamp: new Date().toISOString(),
      uptimeMillis: 50000,
      connectionQuality: 100
    });

    const msg = adapter.parseIncomingMessage(rawHb);
    assert.ok(adapter.isHeartbeat(msg));
    if (adapter.isHeartbeat(msg)) {
      assert.strictEqual(msg.uptimeMillis, 50000);
      assert.strictEqual(msg.connectionQuality, 100);
    }
  });

  it('9. Parses valid Emergency Stop envelope', () => {
    const rawEStop = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'EMERGENCY_STOP',
      messageId: 'estop-123',
      robotId,
      timestamp: new Date().toISOString(),
      triggerSource: 'PHYSICAL_BUTTON',
      active: true
    });

    const msg = adapter.parseIncomingMessage(rawEStop);
    assert.ok(adapter.isEmergencyStop(msg));
    if (adapter.isEmergencyStop(msg)) {
      assert.strictEqual(msg.triggerSource, 'PHYSICAL_BUTTON');
      assert.strictEqual(msg.active, true);
    }
  });

  it('10. Parses valid Fault envelope', () => {
    const rawFault = JSON.stringify({
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'FAULT',
      messageId: 'fault-123',
      robotId,
      timestamp: new Date().toISOString(),
      category: 'MOTOR',
      severity: 'CRITICAL',
      description: 'Stall detected on axis X',
      faultCode: 'ERR_MOT_01'
    });

    const msg = adapter.parseIncomingMessage(rawFault);
    assert.ok(adapter.isFault(msg));
    if (adapter.isFault(msg)) {
      assert.strictEqual(msg.category, 'MOTOR');
      assert.strictEqual(msg.severity, 'CRITICAL');
      assert.strictEqual(msg.faultCode, 'ERR_MOT_01');
    }
  });
});
