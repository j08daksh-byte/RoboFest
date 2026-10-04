import { HardwareTransport, HardwareConnectionState } from '../protocol/adapter';

const MAX_MESSAGE_SIZE = 4096;

/**
 * Loopback implementation for simulated testing without a physical ESP32.
 * Strictly adheres to the asynchronous contract.
 */
export class MockHardwareTransport implements HardwareTransport {
  private state: HardwareConnectionState = 'DISCONNECTED';
  private messageHandler?: (payload: string) => void;
  private stateHandler?: (state: HardwareConnectionState) => void;
  
  // Public for test assertions
  public sentMessages: string[] = [];
  public shouldFailConnect = false;

  public async connect(): Promise<void> {
    if (this.state !== 'DISCONNECTED' && this.state !== 'FAULT') return;
    
    this.setState('CONNECTING');
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.shouldFailConnect) {
          this.setState('FAULT');
          reject(new Error('Simulated physical connection failure'));
        } else {
          this.setState('CONNECTED');
          resolve();
        }
      }, 10);
    });
  }

  public async disconnect(): Promise<void> {
    this.setState('DISCONNECTED');
  }

  public send(payload: string): void {
    if (this.state !== 'CONNECTED') {
      throw new Error(`Cannot send message while in state: ${this.state}`);
    }
    this.sentMessages.push(payload);
  }

  public onMessage(handler: (payload: string) => void): void {
    this.messageHandler = handler;
  }

  public onConnectionStateChange(handler: (state: HardwareConnectionState) => void): void {
    this.stateHandler = handler;
  }

  public getConnectionState(): HardwareConnectionState {
    return this.state;
  }

  // Simulate an incoming frame from the hardware
  public simulateIncomingFrame(payload: string) {
    if (payload.length > MAX_MESSAGE_SIZE) {
      return; // Simulate hardware buffer drop for oversized frame
    }
    if (this.messageHandler) {
      this.messageHandler(payload);
    }
  }

  // Allow tests to manipulate state directly for coverage
  public simulateStateChange(newState: HardwareConnectionState) {
    this.setState(newState);
  }

  private setState(newState: HardwareConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.stateHandler) {
        this.stateHandler(newState);
      }
    }
  }
}
