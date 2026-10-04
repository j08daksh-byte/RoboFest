import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { POST } from './route';
import { GET } from './[id]/route';

// Mock dependencies
mock.module('@/lib/authBoundary', {
  namedExports: {
    withAuth: async (req: Request, roles: string[], handler: any) => {
      // Very basic mock of the auth boundary for testing
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
      if (authHeader === 'Bearer unauthorized-token') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      
      const user = { id: 'test-user-123', role: 'OPERATOR' };
      return handler(req, user);
    }
  }
});

mock.module('@prisma/client', {
  namedExports: {
    PrismaClient: class {
      commandRecord = {
        create: async (args: any) => {
          if (args.data.commandId === 'fail-db') {
            throw new Error('Database connection failed');
          }
          if (args.data.commandId === 'duplicate-id') {
            const error: any = new Error('Unique constraint');
            error.code = 'P2002';
            throw error;
          }
          return { id: 'uuid-1', ...args.data };
        },
        findUnique: async (args: any) => {
          if (args.where.commandId === 'duplicate-id') {
            return {
              id: 'uuid-1',
              commandId: 'duplicate-id',
              status: 'PENDING',
              operatorId: 'test-user-123'
            };
          }
          if (args.where.commandId === 'valid-id') {
            return {
              id: 'uuid-2',
              commandId: 'valid-id',
              status: 'PENDING',
              operatorId: 'test-user-123'
            };
          }
          if (args.where.commandId === 'other-user-cmd') {
             return {
              id: 'uuid-3',
              commandId: 'other-user-cmd',
              status: 'PENDING',
              operatorId: 'different-user'
            };
          }
          return null;
        }
      }
    }
  }
});


describe('Command API', () => {
  it('A. Unauthenticated command returns 401', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      body: JSON.stringify({ type: 'TRIGGER_EMERGENCY_STOP', id: 'cmd-1', timestamp: '2026-01-01T00:00:00Z', source: 'UI' })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 401);
  });

  it('B. Unauthorized command returns 403', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer unauthorized-token' },
      body: JSON.stringify({ type: 'TRIGGER_EMERGENCY_STOP', id: 'cmd-1', timestamp: '2026-01-01T00:00:00Z', source: 'UI' })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 403);
  });

  it('C. Malformed command returns 400', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ type: 'UNKNOWN_TYPE', id: 'cmd-1' }) // Missing timestamp, bad type
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.status, 'REJECTED');
  });

  it('D. Unknown command type returns 400', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ type: 'FAKE_COMMAND', id: 'cmd-1', timestamp: '2026-01-01T00:00:00Z', source: 'UI' })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
  });

  it('E. Authenticated valid locomotion command is persisted as PENDING', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ 
        type: 'UPDATE_LOCOMOTION', 
        id: 'cmd-loco', 
        timestamp: '2026-01-01T00:00:00Z', 
        source: 'UI',
        payload: { x: 1, y: 2, trackOffsetDelta: 0 }
      })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ACCEPTED');
  });

  it('I. Emergency stop remains permitted', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ 
        type: 'TRIGGER_EMERGENCY_STOP', 
        id: 'cmd-estop', 
        timestamp: '2026-01-01T00:00:00Z', 
        source: 'UI'
      })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ACCEPTED');
  });

  it('J. Duplicate command ID returns truthful duplicate response', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ 
        type: 'TRIGGER_EMERGENCY_STOP', 
        id: 'duplicate-id', 
        timestamp: '2026-01-01T00:00:00Z', 
        source: 'UI'
      })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.reason, 'Duplicate command submitted');
  });

  it('K. Database failure is not reported as command acceptance', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ 
        type: 'TRIGGER_EMERGENCY_STOP', 
        id: 'fail-db', 
        timestamp: '2026-01-01T00:00:00Z', 
        source: 'UI'
      })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.status, 'REJECTED');
  });

  it('L. GET command by ID returns persisted record', async () => {
    const req = new Request('http://localhost/api/robot/command/valid-id', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    
    const context = { params: Promise.resolve({ id: 'valid-id' }) };
    const res = await GET(req, context);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.commandId, 'valid-id');
  });

  it('M. IDOR protection for command lookup', async () => {
    const req = new Request('http://localhost/api/robot/command/other-user-cmd', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    
    const context = { params: Promise.resolve({ id: 'other-user-cmd' }) };
    const res = await GET(req, context);
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes('Forbidden'));
  });
});
