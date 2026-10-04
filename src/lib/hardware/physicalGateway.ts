import { HardwareGateway } from './gateway';
import { HardwareTransport, Esp32ProtocolAdapter, HardwareConnectionState } from './protocol/adapter';
import { 
  HardwareCommandEnvelope, 
  HardwareAckEnvelope, 
  HardwareTelemetryEnvelope,
  HardwareAckStatus
} from './domain';
import { ESP32_PROTOCOL_VERSION } from './protocol/domain';

export class PhysicalHardwareGateway implements HardwareGateway {
  private transport: HardwareTransport;
  private adapter: Esp32ProtocolAdapter;
  
  private telemetryHandler?: (telemetry: HardwareTelemetryEnvelope) => void;
  private ackHandler?: (ack: HardwareAckEnvelope) => void;
  private connectionHandler?: (state: HardwareConnectionState) => void;
  private estopHandler?: (reason: string) => void;

  // Track pending commands to correlate ACKs
  private pendingCommands = new Set<string>();

  constructor(transport: HardwareTransport, adapter: Esp32ProtocolAdapter = new Esp32ProtocolAdapter()) {
    this.transport = transport;
    this.adapter = adapter;

    this.transport.onConnectionStateChange((state) => {
      if (this.connectionHandler) {
        this.connectionHandler(state);
      }
    });

    this.transport.onMessage((payload) => {
      this.handleIncomingMessage(payload);
    });
  }

  public async connect(): Promise<void> {
    await this.transport.connect();
  }

  public async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this.pendingCommands.clear();
  }

  public sendCommand(command: HardwareCommandEnvelope): void {
    if (this.transport.getConnectionState() !== 'CONNECTED') {
      throw new Error('Hardware disconnected. Cannot send command.');
    }
    const encoded = this.adapter.encodeCommand(command);
    this.pendingCommands.add(command.commandId);
    this.transport.send(encoded);
  }

  public emergencyStop(): void {
    if (this.transport.getConnectionState() === 'CONNECTED') {
      const eStopCommand: HardwareCommandEnvelope = {
        commandId: `estop-${Date.now()}`,
        timestamp: new Date().toISOString(),
        robotId: 'SYSTEM',
        type: 'EMERGENCY_STOP',
        parameters: { reason: 'SOFTWARE_GATEWAY_TRIGGERED' },
        protocolVersion: ESP32_PROTOCOL_VERSION
      };
      const encoded = this.adapter.encodeCommand(eStopCommand);
      this.transport.send(encoded);
    }
  }

  public getConnectionStatus(): HardwareConnectionState {
    return this.transport.getConnectionState();
  }

  public onTelemetryReceived(handler: (telemetry: HardwareTelemetryEnvelope) => void): void {
    this.telemetryHandler = handler;
  }

  public onAckReceived(handler: (ack: HardwareAckEnvelope) => void): void {
    this.ackHandler = handler;
  }

  public onConnectionChanged(handler: (state: HardwareConnectionState) => void): void {
    this.connectionHandler = handler;
  }

  public onHardwareEmergencyStop(handler: (reason: string) => void): void {
    this.estopHandler = handler;
  }

  private handleIncomingMessage(payload: string) {
    try {
      const msg = this.adapter.parseIncomingMessage(payload);

      if (this.adapter.isAck(msg)) {
        if (!this.pendingCommands.has(msg.commandId)) {
          console.warn(`Ignoring ACK for unknown/duplicate command: ${msg.commandId}`);
          return;
        }

        // Map physical ACK status to generic hardware ACK status
        const ack: HardwareAckEnvelope = {
          commandId: msg.commandId,
          robotId: msg.robotId,
          timestamp: msg.timestamp,
          status: msg.status as HardwareAckStatus,
          reason: msg.errorMessage,
          protocolVersion: msg.protocolVersion
        };

        if (msg.status === 'ACKNOWLEDGED' || msg.status === 'FAILED' || msg.status === 'REJECTED' || msg.status === 'TIMED_OUT') {
          this.pendingCommands.delete(msg.commandId);
        }

        if (this.ackHandler) {
          this.ackHandler(ack);
        }
      } 
      else if (this.adapter.isTelemetry(msg)) {
        if (this.telemetryHandler) {
          // Convert ESP32 telemetry format to canonical
          const t: HardwareTelemetryEnvelope = {
            robotId: msg.robotId,
            timestamp: msg.timestamp,
            sequence: msg.sequence,
            protocolVersion: msg.protocolVersion,
            source: 'HARDWARE',
            mode: 'LIVE',
            actuators: {
              torchEnabled: msg.torchState?.enabled ?? false,
              electromagnetEnabled: msg.electromagnetState?.enabled ?? false,
              armX: msg.armState?.x ?? 0,
              armY: msg.armState?.y ?? 0,
              motorTempLeft: msg.temperature?.motorTemp ?? 0,
              motorTempRight: msg.temperature?.motorTemp ?? 0
            },
            sensors: {
              voltage: msg.power?.batteryVoltage ?? 0,
              current: msg.power?.currentDraw ?? 0,
              vibration: 0,
              temperatureC: msg.temperature?.ambientTemp ?? 0,
              imuTilt: 0 // Simplification since imu was abstracted in previous layers
            },
            faults: msg.faults || []
          };
          this.telemetryHandler(t);
        }
      }
      else if (this.adapter.isEmergencyStop(msg)) {
        if (this.estopHandler) {
          this.estopHandler(msg.triggerSource || 'PHYSICAL_BUTTON');
        }
      }
      else if (this.adapter.isHeartbeat(msg)) {
        // Simple heartbeat receiver, connection state is managed by TCP timeouts internally typically
      }
      else if (this.adapter.isFault(msg)) {
        // Can route to telemetry faults or handle separately
      }
    } catch (e) {
      console.error('Dropped malformed or invalid hardware packet:', e);
    }
  }
}
