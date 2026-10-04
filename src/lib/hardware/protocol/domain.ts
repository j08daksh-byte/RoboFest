export const ESP32_PROTOCOL_VERSION = '1.0.0';

export type ProtocolMessageType = 
  | 'COMMAND'
  | 'COMMAND_ACK'
  | 'TELEMETRY'
  | 'HEARTBEAT'
  | 'EMERGENCY_STOP'
  | 'FAULT';

export interface BaseProtocolMessage {
  protocolVersion: string;
  messageType: ProtocolMessageType;
  robotId: string;
  timestamp: string;
  messageId: string;
}

// -----------------------------------------
// 1. COMMAND
// -----------------------------------------
export type ProtocolCommandType = 
  | 'LOCOMOTION' 
  | 'ARM_X' 
  | 'ARM_Y' 
  | 'TORCH' 
  | 'ELECTROMAGNET' 
  | 'EMERGENCY_STOP';

export interface Esp32CommandMessage extends BaseProtocolMessage {
  messageType: 'COMMAND';
  commandId: string;
  commandType: ProtocolCommandType;
  parameters: Record<string, unknown>;
  correlationId?: string;
}

// -----------------------------------------
// 2. COMMAND ACK
// -----------------------------------------
export type HardwareAckStatus = 
  | 'RECEIVED'
  | 'ACCEPTED'
  | 'EXECUTING'
  | 'ACKNOWLEDGED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'REJECTED';

export interface Esp32CommandAckMessage extends BaseProtocolMessage {
  messageType: 'COMMAND_ACK';
  commandId: string;
  status: HardwareAckStatus;
  errorCode?: string;
  errorMessage?: string;
  executionDuration?: number;
}

// -----------------------------------------
// 3. TELEMETRY
// -----------------------------------------
export interface Esp32TelemetryMessage extends BaseProtocolMessage {
  messageType: 'TELEMETRY';
  sequence: number;
  source: 'HARDWARE';
  mode: 'LIVE';
  position: { x: number; y: number; theta: number };
  armState: { x: number; y: number };
  torchState: { enabled: boolean };
  electromagnetState: { enabled: boolean };
  motionState: { moving: boolean; velocity: number };
  power: { batteryVoltage: number; currentDraw: number };
  temperature: { motorTemp: number; ambientTemp: number };
  emergencyState: { active: boolean };
  faults: string[];
}

// -----------------------------------------
// 4. HEARTBEAT
// -----------------------------------------
export interface Esp32HeartbeatMessage extends BaseProtocolMessage {
  messageType: 'HEARTBEAT';
  uptimeMillis: number;
  connectionQuality: number; // 0-100%
}

// Connection Supervision Constants
export const SUPERVISION_POLICY = {
  HEARTBEAT_INTERVAL_MS: 1000,
  MISSED_HEARTBEATS_DEGRADED: 3,
  MISSED_HEARTBEATS_DISCONNECTED: 10
};

// -----------------------------------------
// 5. HARDWARE EMERGENCY STOP
// -----------------------------------------
export interface Esp32EmergencyStopMessage extends BaseProtocolMessage {
  messageType: 'EMERGENCY_STOP';
  triggerSource: 'PHYSICAL_BUTTON' | 'SENSOR_OVERRIDE' | 'UNKNOWN';
  active: boolean;
}

// -----------------------------------------
// 6. FAULTS
// -----------------------------------------
export type HardwareFaultCategory = 
  | 'COMMUNICATION'
  | 'MOTOR'
  | 'TORCH'
  | 'ELECTROMAGNET'
  | 'POWER'
  | 'TEMPERATURE'
  | 'EMERGENCY_STOP'
  | 'UNKNOWN';

export interface Esp32FaultMessage extends BaseProtocolMessage {
  messageType: 'FAULT';
  category: HardwareFaultCategory;
  severity: 'WARNING' | 'CRITICAL' | 'FATAL';
  description: string;
  faultCode: string;
}

// Union Type for Parsing
export type Esp32IncomingMessage = 
  | Esp32CommandAckMessage
  | Esp32TelemetryMessage
  | Esp32HeartbeatMessage
  | Esp32EmergencyStopMessage
  | Esp32FaultMessage;
