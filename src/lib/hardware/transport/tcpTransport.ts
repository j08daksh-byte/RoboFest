import * as net from 'net';
import { HardwareTransport, HardwareConnectionState } from '../protocol/adapter';

const MAX_MESSAGE_SIZE = 4096;

/**
 * Concrete implementation of the HardwareTransport using a TCP Client socket.
 * Selected over WebSocket/HTTP because raw TCP socket with \n framing 
 * is the most robust, lowest-overhead physical layer for ESP32 RTOS C/C++ firmware.
 * 
 * Frame delimiter: \n (newline).
 */
export class TcpHardwareTransport implements HardwareTransport {
  private state: HardwareConnectionState = 'DISCONNECTED';
  private socket: net.Socket | null = null;
  private messageBuffer = '';
  
  private messageHandler?: (payload: string) => void;
  private stateHandler?: (state: HardwareConnectionState) => void;

  constructor(
    private host: string = process.env.ESP32_HOST || '192.168.1.100',
    private port: number = parseInt(process.env.ESP32_PORT || '5000', 10)
  ) {}

  public async connect(): Promise<void> {
    if (this.state !== 'DISCONNECTED' && this.state !== 'FAULT') {
      return;
    }

    this.setState('CONNECTING');
    
    // In an actual physical scenario, this creates a real TCP connection
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      
      this.socket.setTimeout(5000); // 5 sec connection timeout

      this.socket.on('connect', () => {
        this.setState('CONNECTED');
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleData(data);
      });

      this.socket.on('error', (err) => {
        this.setState('FAULT');
        reject(err);
      });

      this.socket.on('close', () => {
        this.setState('DISCONNECTED');
        this.socket = null;
      });

      this.socket.on('timeout', () => {
        this.socket?.destroy();
        this.setState('FAULT');
        reject(new Error('Connection timed out'));
      });

      this.socket.connect(this.port, this.host);
    });
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.setState('DISCONNECTED');
  }

  public send(payload: string): void {
    if (this.state !== 'CONNECTED' || !this.socket) {
      throw new Error(`Cannot send message while in state: ${this.state}`);
    }
    // Framing: send payload followed by newline
    this.socket.write(payload + '\n');
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

  private setState(newState: HardwareConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.stateHandler) {
        this.stateHandler(newState);
      }
    }
  }

  private handleData(data: Buffer) {
    this.messageBuffer += data.toString('utf-8');

    // Protect against unbounded buffer attacks (malformed packets without newlines)
    if (this.messageBuffer.length > MAX_MESSAGE_SIZE) {
      this.messageBuffer = ''; // discard oversized buffer
      return;
    }

    // Process all \n delimited frames
    let newlineIndex = this.messageBuffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const frame = this.messageBuffer.slice(0, newlineIndex).trim();
      this.messageBuffer = this.messageBuffer.slice(newlineIndex + 1);

      if (frame.length > 0 && this.messageHandler) {
        this.messageHandler(frame);
      }
      newlineIndex = this.messageBuffer.indexOf('\n');
    }
  }
}
