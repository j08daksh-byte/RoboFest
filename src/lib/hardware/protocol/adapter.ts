import { 
  ESP32_PROTOCOL_VERSION,
  ProtocolCommandType,
  Esp32CommandMessage,
  Esp32IncomingMessage,
  Esp32CommandAckMessage,
  Esp32TelemetryMessage,
  Esp32HeartbeatMessage,
  Esp32FaultMessage,
  Esp32EmergencyStopMessage
} from './domain';
import { HardwareCommandEnvelope } from '../domain';

export type HardwareConnectionState = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'DEGRADED' 
  | 'FAULT' 
  | 'STOPPED';

export interface HardwareTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(payload: string): void;
  onMessage(handler: (payload: string) => void): void;
  onConnectionStateChange(handler: (state: HardwareConnectionState) => void): void;
  getConnectionState(): HardwareConnectionState;
}

export class Esp32ProtocolAdapter {
  /**
   * Translates a HardwareCommandEnvelope from the Gateway into a serialized ESP32 JSON string.
   */
  public encodeCommand(command: HardwareCommandEnvelope): string {
    // Map canonical generic types to ESP32 protocol types
    let espType: ProtocolCommandType;
    switch (command.type) {
      case 'LOCOMOTION': espType = 'LOCOMOTION'; break;
      case 'ARM_X': espType = 'ARM_X'; break;
      case 'ARM_Y': espType = 'ARM_Y'; break;
      case 'TORCH': espType = 'TORCH'; break;
      case 'ELECTROMAGNET': espType = 'ELECTROMAGNET'; break;
      case 'EMERGENCY_STOP': espType = 'EMERGENCY_STOP'; break;
      default:
        throw new Error(`Unsupported command type: ${command.type}`);
    }

    const msg: Esp32CommandMessage = {
      protocolVersion: ESP32_PROTOCOL_VERSION,
      messageType: 'COMMAND',
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      robotId: command.robotId,
      timestamp: command.timestamp,
      commandId: command.commandId,
      commandType: espType,
      parameters: command.parameters,
      correlationId: command.correlationId
    };

    return JSON.stringify(msg);
  }

  /**
   * Parses raw string payload into typed incoming message. Throws on validation failure.
   */
  public parseIncomingMessage(payload: string): Esp32IncomingMessage {
    let raw: unknown;
    try {
      raw = JSON.parse(payload);
    } catch {
      throw new Error('Malformed JSON payload');
    }

    const rawObj = raw as Record<string, unknown>;
    if (!rawObj.protocolVersion || !rawObj.messageType || !rawObj.robotId || !rawObj.messageId || !rawObj.timestamp) {
      throw new Error('Missing base protocol fields');
    }

    if (rawObj.protocolVersion !== ESP32_PROTOCOL_VERSION) {
      throw new Error(`Protocol version mismatch. Expected ${ESP32_PROTOCOL_VERSION}, got ${rawObj.protocolVersion}`);
    }

    // This acts as a type assertion/guard block. We pass it through directly for the adapter.
    return raw as Esp32IncomingMessage;
  }

  public isAck(msg: Esp32IncomingMessage): msg is Esp32CommandAckMessage {
    return msg.messageType === 'COMMAND_ACK';
  }

  public isTelemetry(msg: Esp32IncomingMessage): msg is Esp32TelemetryMessage {
    return msg.messageType === 'TELEMETRY';
  }

  public isHeartbeat(msg: Esp32IncomingMessage): msg is Esp32HeartbeatMessage {
    return msg.messageType === 'HEARTBEAT';
  }

  public isEmergencyStop(msg: Esp32IncomingMessage): msg is Esp32EmergencyStopMessage {
    return msg.messageType === 'EMERGENCY_STOP';
  }

  public isFault(msg: Esp32IncomingMessage): msg is Esp32FaultMessage {
    return msg.messageType === 'FAULT';
  }
}
