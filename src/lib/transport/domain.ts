import { RobotCommand } from '../api/commands';
import { SensorState, EnvironmentState, SafetyState, TelemetrySample, SystemEvent } from '../domain';

export type TransportStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'ERROR';
export type CommandStatus = 'IDLE' | 'PENDING' | 'ACKNOWLEDGED' | 'REJECTED' | 'FAILED' | 'TIMED_OUT';

export interface CommandAcknowledgement {
  commandId: string;
  status: CommandStatus;
  reason?: string;
  timestamp: string;
}

export interface PlatformTelemetry {
  sensor: SensorState;
  environment: EnvironmentState;
  safety: SafetyState;
  telemetrySample: TelemetrySample;
  events: SystemEvent[];
}

export interface TelemetryProvider {
  start(): void;
  stop(): void;
  subscribe(listener: (telemetry: PlatformTelemetry) => void): () => void;
  getStatus(): TransportStatus;
}

export interface CommandTransport {
  sendCommand(command: RobotCommand): void;
  subscribeToAcknowledgements(listener: (ack: CommandAcknowledgement) => void): () => void;
  getStatus(): TransportStatus;
}
