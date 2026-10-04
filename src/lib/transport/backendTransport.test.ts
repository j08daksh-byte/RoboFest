import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { BackendCommandTransport } from './backendTransport';
import { RobotCommand } from '../api/commands';
import { CommandAcknowledgement } from './domain';
import { useAuthStore } from '../authStore';

// We just do simple unit tests on the class logic if we can,
// but fetch() is a global so we could mock it.

describe('BackendCommandTransport', () => {
  let transport: BackendCommandTransport;
  let originalFetch: typeof global.fetch;
  let sentAcks: CommandAcknowledgement[] = [];

  before(() => {
    originalFetch = global.fetch;
    transport = new BackendCommandTransport();
    transport.subscribeToAcknowledgements(ack => sentAcks.push(ack));
    useAuthStore.setState({ status: 'AUTHENTICATED', user: { id: 'test', username: 'test', role: 'ADMIN' } });
  });

  after(() => {
    global.fetch = originalFetch;
  });

  it('B. BackendCommandTransport sends canonical command', async () => {
    sentAcks = [];
    global.fetch = (async (url: string, init?: unknown) => {
      return new Response(JSON.stringify({ status: 'ACCEPTED', commandId: 'test-1' }), { status: 200 });
    }) as unknown as typeof fetch;

    transport.sendCommand({
      type: 'SET_ELECTROMAGNET',
      id: 'test-1',
      timestamp: '2026-01-01T00:00:00Z',
      source: 'UI',
      payload: { enabled: true }
    });

    // wait for async fetch
    await new Promise(r => setTimeout(r, 50));
    
    assert.strictEqual(sentAcks.length, 1);
    assert.strictEqual(sentAcks[0].commandId, 'test-1');
    assert.strictEqual(sentAcks[0].status, 'PENDING'); // Maps ACCEPTED to PENDING
  });

  it('E. 400 remains validation failure', async () => {
    sentAcks = [];
    global.fetch = (async () => new Response(JSON.stringify({ reason: 'Validation' }), { status: 400 })) as unknown as typeof fetch;

    transport.sendCommand({ type: 'TRIGGER_EMERGENCY_STOP', id: 'test-2', timestamp: '', source: 'UI' });
    await new Promise(r => setTimeout(r, 50));
    
    assert.strictEqual(sentAcks.length, 1);
    assert.strictEqual(sentAcks[0].status, 'FAILED');
  });

  it('D. 403 remains authorization failure', async () => {
    sentAcks = [];
    global.fetch = (async () => new Response('Unauthorized', { status: 403 })) as unknown as typeof fetch;

    transport.sendCommand({ type: 'TRIGGER_EMERGENCY_STOP', id: 'test-3', timestamp: '', source: 'UI' });
    await new Promise(r => setTimeout(r, 50));
    
    assert.strictEqual(sentAcks[0].status, 'REJECTED');
  });

  it('F. 409 duplicate is handled', async () => {
    sentAcks = [];
    global.fetch = (async () => new Response('Duplicate', { status: 409 })) as unknown as typeof fetch;

    transport.sendCommand({ type: 'TRIGGER_EMERGENCY_STOP', id: 'test-4', timestamp: '', source: 'UI' });
    await new Promise(r => setTimeout(r, 50));
    
    assert.strictEqual(sentAcks[0].status, 'REJECTED');
  });

  it('G. 5xx does not become ACK', async () => {
    sentAcks = [];
    global.fetch = (async () => new Response('Server Error', { status: 500 })) as unknown as typeof fetch;

    transport.sendCommand({ type: 'TRIGGER_EMERGENCY_STOP', id: 'test-5', timestamp: '', source: 'UI' });
    await new Promise(r => setTimeout(r, 50));
    
    assert.strictEqual(sentAcks[0].status, 'FAILED');
  });
  
  it('H. Network failure does not become ACK', async () => {
    sentAcks = [];
    global.fetch = (async () => { throw new Error('Network offline'); }) as unknown as typeof fetch;

    transport.sendCommand({ type: 'TRIGGER_EMERGENCY_STOP', id: 'test-6', timestamp: '', source: 'UI' });
    await new Promise(r => setTimeout(r, 50));
    
    assert.strictEqual(sentAcks[0].status, 'FAILED');
  });
});
