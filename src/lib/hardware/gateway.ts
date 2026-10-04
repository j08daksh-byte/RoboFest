import { 
  HardwareCommandEnvelope, 
  HardwareAckEnvelope, 
  HardwareTelemetryEnvelope, 
  HardwareConnectionState 
} from './domain';

export interface HardwareGateway {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  sendCommand(command: HardwareCommandEnvelope): void;
  
  getConnectionStatus(): HardwareConnectionState;
  
  // Handlers for incoming hardware events
  onTelemetryReceived(handler: (telemetry: HardwareTelemetryEnvelope) => void): void;
  onAckReceived(handler: (ack: HardwareAckEnvelope) => void): void;
  onConnectionChanged(handler: (state: HardwareConnectionState) => void): void;
  onHardwareEmergencyStop(handler: (reason: string) => void): void;
  
  // Hardware-level override, separate from standard sendCommand
  emergencyStop(): void;
}
