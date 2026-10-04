import test from 'node:test';
import assert from 'node:assert';
import * as net from 'net';
import { TcpHardwareTransport } from './tcpTransport';

test('TcpHardwareTransport', async (t) => {
  let server: net.Server;
  let serverPort = 0;
  let transport: TcpHardwareTransport;
  let clientSocket: net.Socket | null = null;

  t.beforeEach(() => {
    return new Promise<void>((resolve) => {
      server = net.createServer((socket) => {
        clientSocket = socket;
      });
      server.listen(0, '127.0.0.1', () => {
        serverPort = (server.address() as net.AddressInfo).port;
        transport = new TcpHardwareTransport('127.0.0.1', serverPort);
        resolve();
      });
    });
  });

  t.afterEach(() => {
    return new Promise<void>((resolve) => {
      if (clientSocket) {
        clientSocket.destroy();
        clientSocket = null;
      }
      server.close(() => {
        resolve();
      });
    });
  });

  await t.test('1. connect state and disconnect', async () => {
    assert.strictEqual(transport.getConnectionState(), 'DISCONNECTED');
    await transport.connect();
    assert.strictEqual(transport.getConnectionState(), 'CONNECTED');

    await transport.disconnect();
    assert.strictEqual(transport.getConnectionState(), 'DISCONNECTED');
  });

  await t.test('2. connection failure transitions to FAULT', async () => {
    // Port 1 should fail
    const badTransport = new TcpHardwareTransport('127.0.0.1', 1);
    await assert.rejects(badTransport.connect(), Error);
    assert.strictEqual(badTransport.getConnectionState(), 'FAULT');
  });

  await t.test('3. message framing correctly parses newline separated frames', async () => {
    await transport.connect();
    
    const receivedPayloads: string[] = [];
    transport.onMessage((payload) => {
      receivedPayloads.push(payload);
    });

    // We can simulate hardware sending multiple lines
    clientSocket!.write('frame1\nframe2\n');
    
    // Wait slightly for stream
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.strictEqual(receivedPayloads.length, 2);
    assert.strictEqual(receivedPayloads[0], 'frame1');
    assert.strictEqual(receivedPayloads[1], 'frame2');
  });

  await t.test('4. malformed/partial packets are held until newline', async () => {
    await transport.connect();
    
    const receivedPayloads: string[] = [];
    transport.onMessage((payload) => {
      receivedPayloads.push(payload);
    });

    clientSocket!.write('partial');
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.strictEqual(receivedPayloads.length, 0);

    clientSocket!.write('frame\n');
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    assert.strictEqual(receivedPayloads.length, 1);
    assert.strictEqual(receivedPayloads[0], 'partialframe');
  });

  await t.test('5. oversized messages are dropped', async () => {
    await transport.connect();
    
    const receivedPayloads: string[] = [];
    transport.onMessage((payload) => {
      receivedPayloads.push(payload);
    });

    // Exceed MAX_MESSAGE_SIZE without newline
    const huge = 'A'.repeat(5000);
    clientSocket!.write(huge);
    
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Then send a valid one
    clientSocket!.write('valid\n');
    await new Promise((resolve) => setTimeout(resolve, 10));

    // The oversized buffer is discarded, so it should only receive 'valid'
    assert.strictEqual(receivedPayloads.length, 1);
    assert.strictEqual(receivedPayloads[0], 'valid');
  });
});
