import { 
  TelemetryProvider, 
  CommandTransport, 
  PlatformTelemetry, 
  CommandAcknowledgement, 
  TransportStatus 
} from './domain';
import { RobotCommand } from '../api/commands';
import { telemetrySimulator, SimulatorStateGetter } from '../telemetry/simulator';

export class SimulationTelemetryProvider implements TelemetryProvider {
  private listeners: Set<(telemetry: PlatformTelemetry) => void> = new Set();
  private status: TransportStatus = 'DISCONNECTED';
  private getState: SimulatorStateGetter;

  constructor(getState: SimulatorStateGetter) {
    this.getState = getState;
  }

  public start(): void {
    if (this.status === 'CONNECTED') return;
    this.status = 'CONNECTED';
    telemetrySimulator.start(this.getState, (telemetry) => {
      this.listeners.forEach(l => l(telemetry));
    });
  }

  public stop(): void {
    this.status = 'DISCONNECTED';
    telemetrySimulator.stop();
  }

  public subscribe(listener: (telemetry: PlatformTelemetry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getStatus(): TransportStatus {
    return this.status;
  }
}

export class SimulationCommandTransport implements CommandTransport {
  private ackListeners: Set<(ack: CommandAcknowledgement) => void> = new Set();
  private status: TransportStatus = 'CONNECTED';

  public sendCommand(command: RobotCommand): void {
    if (this.status !== 'CONNECTED') {
      setTimeout(() => {
        this.notifyAck({
          commandId: command.id,
          status: 'FAILED',
          reason: 'Transport disconnected',
          timestamp: new Date().toISOString()
        });
      }, 0);
      return;
    }

    // Acknowledge automatically after a deterministic tiny delay (e.g., 20ms) to simulate network/hardware
    setTimeout(() => {
      // We could add deterministic failure scenarios here based on command properties,
      // but for now, we just simulate successful acknowledgement.
      this.notifyAck({
        commandId: command.id,
        status: 'ACKNOWLEDGED',
        timestamp: new Date().toISOString()
      });
    }, 20);
  }

  public subscribeToAcknowledgements(listener: (ack: CommandAcknowledgement) => void): () => void {
    this.ackListeners.add(listener);
    return () => this.ackListeners.delete(listener);
  }

  public getStatus(): TransportStatus {
    return this.status;
  }

  private notifyAck(ack: CommandAcknowledgement) {
    this.ackListeners.forEach(l => l(ack));
  }
}
