import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { GET } from './route';

describe('Realtime SSE Service Authentication', () => {
  const originalToken = process.env.ROBOFEST_SERVICE_TOKEN;

  before(() => {
    process.env.ROBOFEST_SERVICE_TOKEN = 'test-secret-token-123';
  });

  after(() => {
    process.env.ROBOFEST_SERVICE_TOKEN = originalToken;
  });

  it('1. valid service token -> authorized', async () => {
    const req = new Request('http://localhost/api/realtime', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-secret-token-123'
      }
    });

    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Content-Type'), 'text/event-stream');
  });

  it('2. invalid service token -> 401', async () => {
    const req = new Request('http://localhost/api/realtime', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer wrong-token-456'
      }
    });

    const res = await GET(req);
    assert.strictEqual(res.status, 401);
  });

  it('3. missing service token (and no cookie) -> 401', async () => {
    const req = new Request('http://localhost/api/realtime', {
      method: 'GET',
    });

    const res = await GET(req);
    assert.strictEqual(res.status, 401);
  });

  it('4. empty configured service token -> never authorizes', async () => {
    process.env.ROBOFEST_SERVICE_TOKEN = '';
    
    const req = new Request('http://localhost/api/realtime', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer '
      }
    });

    const res = await GET(req);
    assert.strictEqual(res.status, 401);
  });
});
