import { 
  CommandTransport, 
  CommandAcknowledgement, 
  TransportStatus 
} from './domain';
import { RobotCommand } from '../api/commands';
import { useAuthStore } from '../authStore';

export class BackendCommandTransport implements CommandTransport {
  private ackListeners: Set<(ack: CommandAcknowledgement) => void> = new Set();
  private status: TransportStatus = 'CONNECTED';

  public sendCommand(command: RobotCommand): void {
    if (this.status !== 'CONNECTED') {
      this.notifyAck({
        commandId: command.id,
        status: 'FAILED',
        reason: 'Transport disconnected',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const status = useAuthStore.getState().status;
    if (status !== 'AUTHENTICATED') {
      this.notifyAck({
        commandId: command.id,
        status: 'FAILED',
        reason: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    this.executeFetch(command);
  }

  private async executeFetch(command: RobotCommand) {
    try {
      const response = await fetch('/api/robot/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(command)
      });

      if (response.status === 401 || response.status === 403) {
        this.notifyAck({
          commandId: command.id,
          status: 'REJECTED',
          reason: 'Unauthorized',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (response.status === 409) {
         this.notifyAck({
          commandId: command.id,
          status: 'REJECTED',
          reason: 'Duplicate command submitted',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await response.json();
      
      if (response.ok) {
        // We received ACCEPTED (which maps to PENDING execution in our semantics)
        // Backend commands do NOT instantly execute.
        this.notifyAck({
          commandId: command.id,
          status: 'PENDING',
          timestamp: new Date().toISOString()
        });
        
        // Optional bounded polling could go here to check if it ever becomes ACKNOWLEDGED.
        // For Phase 13C, physical ACK is NOT IMPLEMENTED, so it remains PENDING.
      } else {
        this.notifyAck({
          commandId: command.id,
          status: 'FAILED',
          reason: result.reason || 'Server rejection',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      this.notifyAck({
        commandId: command.id,
        status: 'FAILED',
        reason: 'Network error',
        timestamp: new Date().toISOString()
      });
    }
  }

  public subscribeToAcknowledgements(listener: (ack: CommandAcknowledgement) => void): () => void {
    this.ackListeners.add(listener);
    return () => this.ackListeners.delete(listener);
  }

  public getStatus(): TransportStatus {
    return this.status;
  }

  private notifyAck(ack: CommandAcknowledgement) {
    setTimeout(() => {
      this.ackListeners.forEach(l => l(ack));
    }, 0);
  }
}
