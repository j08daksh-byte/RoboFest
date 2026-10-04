import { HardwareGateway } from './gateway';
import { 
  HardwareCommandEnvelope, 
  HardwareAckEnvelope, 
  HardwareTelemetryEnvelope, 
  HardwareConnectionState 
} from './domain';

export class SimulationHardwareGateway implements HardwareGateway {
  private status: HardwareConnectionState = 'DISCONNECTED';
  private telemetryHandlers: ((telemetry: HardwareTelemetryEnvelope) => void)[] = [];
  private ackHandlers: ((ack: HardwareAckEnvelope) => void)[] = [];
  private connectionHandlers: ((state: HardwareConnectionState) => void)[] = [];
  private eStopHandlers: ((reason: string) => void)[] = [];
  
  private processedCommandIds: Set<string> = new Set();
  
  public async connect(): Promise<void> {
    this.setStatus('CONNECTING');
    await new Promise(resolve => setTimeout(resolve, 50));
    this.setStatus('CONNECTED');
    
    // Simulate incoming telemetry loop
    this.startSimulatedTelemetry();
  }

  public async disconnect(): Promise<void> {
    this.setStatus('DISCONNECTED');
  }

  public sendCommand(command: HardwareCommandEnvelope): void {
    if (this.status !== 'CONNECTED') {
      this.notifyAck({
        commandId: command.commandId,
        timestamp: new Date().toISOString(),
        robotId: command.robotId,
        status: 'REJECTED',
        reason: 'Hardware disconnected',
        protocolVersion: '1.0.0'
      });
      return;
    }

    // Duplicate command protection (idempotency)
    if (this.processedCommandIds.has(command.commandId)) {
      this.notifyAck({
        commandId: command.commandId,
        timestamp: new Date().toISOString(),
        robotId: command.robotId,
        status: 'REJECTED',
        reason: 'Duplicate command',
        protocolVersion: '1.0.0'
      });
      return;
    }
    this.processedCommandIds.add(command.commandId);

    // Initial RECEIVED ack
    this.notifyAck({
      commandId: command.commandId,
      timestamp: new Date().toISOString(),
      robotId: command.robotId,
      status: 'RECEIVED',
      protocolVersion: '1.0.0'
    });

    // Rejection Simulation
    if (command.type === 'REJECTION_TEST') {
      setTimeout(() => {
        this.notifyAck({
          commandId: command.commandId,
          timestamp: new Date().toISOString(),
          robotId: command.robotId,
          status: 'REJECTED',
          reason: 'Hardware rejection test',
          protocolVersion: '1.0.0'
        });
      }, 5);
      return;
    }

    // ACCEPTED phase
    setTimeout(() => {
      this.notifyAck({
        commandId: command.commandId,
        timestamp: new Date().toISOString(),
        robotId: command.robotId,
        status: 'ACCEPTED',
        protocolVersion: '1.0.0'
      });
      
      // EXECUTING phase
      setTimeout(() => {
        this.notifyAck({
          commandId: command.commandId,
          timestamp: new Date().toISOString(),
          robotId: command.robotId,
          status: 'EXECUTING',
          protocolVersion: '1.0.0'
        });

        // Final Terminal Phase (ACKNOWLEDGED, TIMED_OUT, or FAILED)
        setTimeout(() => {
          if (command.type === 'TIMEOUT_TEST') {
            this.notifyAck({
              commandId: command.commandId,
              timestamp: new Date().toISOString(),
              robotId: command.robotId,
              status: 'TIMED_OUT',
              reason: 'Hardware execution took too long',
              protocolVersion: '1.0.0'
            });
          } else if (command.type === 'FAILURE_TEST') {
            this.notifyAck({
              commandId: command.commandId,
              timestamp: new Date().toISOString(),
              robotId: command.robotId,
              status: 'FAILED',
              reason: 'Hardware execution failed',
              protocolVersion: '1.0.0'
            });
          } else {
            this.notifyAck({
              commandId: command.commandId,
              timestamp: new Date().toISOString(),
              robotId: command.robotId,
              status: 'ACKNOWLEDGED',
              protocolVersion: '1.0.0'
            });
          }
        }, 15);
      }, 10);
    }, 5);
  }

  public emergencyStop(): void {
    this.setStatus('STOPPED');
    this.eStopHandlers.forEach(h => h('SOFTWARE_REQUESTED_HARDWARE_ESTOP'));
  }

  public triggerPhysicalHardwareEStopSimulation(): void {
    this.setStatus('STOPPED');
    this.eStopHandlers.forEach(h => h('PHYSICAL_BUTTON_PRESSED'));
  }

  public getConnectionStatus(): HardwareConnectionState {
    return this.status;
  }

  public onTelemetryReceived(handler: (t: HardwareTelemetryEnvelope) => void): void {
    this.telemetryHandlers.push(handler);
  }

  public onAckReceived(handler: (ack: HardwareAckEnvelope) => void): void {
    this.ackHandlers.push(handler);
  }

  public onConnectionChanged(handler: (state: HardwareConnectionState) => void): void {
    this.connectionHandlers.push(handler);
  }

  public onHardwareEmergencyStop(handler: (reason: string) => void): void {
    this.eStopHandlers.push(handler);
  }

  private setStatus(newStatus: HardwareConnectionState) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.connectionHandlers.forEach(h => h(this.status));
    }
  }

  private notifyAck(ack: HardwareAckEnvelope) {
    this.ackHandlers.forEach(h => h(ack));
  }

  private startSimulatedTelemetry() {
    // In a real adapter, this parses ESP32 UDP/TCP frames.
    // We omit the actual interval loop for test simplicity, 
    // but expose a method to inject.
  }
  
  public injectSimulatedTelemetry(telemetry: HardwareTelemetryEnvelope) {
    if (this.status === 'CONNECTED') {
      this.telemetryHandlers.forEach(h => h(telemetry));
    }
  }
}
