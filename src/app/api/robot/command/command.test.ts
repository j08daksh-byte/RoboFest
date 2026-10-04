import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { POST } from './route';
import { GET } from './[id]/route';
import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();

describe('Command API Integration Tests', () => {
  let validToken = '';
  let otherUserToken = '';
  let operatorId = '';
  let otherUserId = '';
  let testCommandId = `test-cmd-${Date.now()}`;
  let duplicateCommandId = `test-dup-${Date.now()}`;
  
  before(async () => {
    // Create test users
    const operator = await prisma.user.create({
      data: {
        username: `testop_${Date.now()}`,
        passwordHash: 'fakehash',
        role: 'OPERATOR'
      }
    });
    operatorId = operator.id;
    validToken = await signToken({ id: operator.id, role: operator.role });

    const otherOperator = await prisma.user.create({
      data: {
        username: `testother_${Date.now()}`,
        passwordHash: 'fakehash',
        role: 'OPERATOR'
      }
    });
    otherUserId = otherOperator.id;
    otherUserToken = await signToken({ id: otherOperator.id, role: otherOperator.role });
  });

  after(async () => {
    // Cleanup
    await prisma.commandRecord.deleteMany({
      where: { operatorId: { in: [operatorId, otherUserId] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [operatorId, otherUserId] } }
    });
    await prisma.$disconnect();
  });

  it('A. Unauthenticated command returns 401', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      body: JSON.stringify({ type: 'TRIGGER_EMERGENCY_STOP', id: 'cmd-unauth', timestamp: '2026-01-01T00:00:00Z', source: 'UI' })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 401);
  });

  it('B. Unauthorized command returns 403 (Invalid role)', async () => {
    // Generate token with an invalid role for commands (e.g., READ_ONLY, if that existed)
    // For this test, we just pass an empty token payload that gets verified but has no role.
    const badToken = await signToken({ id: operatorId, role: 'GUEST' });
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${badToken}` },
      body: JSON.stringify({ type: 'TRIGGER_EMERGENCY_STOP', id: 'cmd-unauth2', timestamp: '2026-01-01T00:00:00Z', source: 'UI' })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 403);
  });

  it('C. Malformed command returns 400', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ type: 'UNKNOWN_TYPE', id: 'cmd-malformed' }) // Missing timestamp, bad type
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.status, 'REJECTED');
  });

  it('D. Unknown command type returns 400', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ type: 'FAKE_COMMAND', id: 'cmd-fake', timestamp: '2026-01-01T00:00:00Z', source: 'UI' })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
  });

  it('E. Authenticated valid locomotion command is persisted as PENDING', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ 
        type: 'UPDATE_LOCOMOTION', 
        id: testCommandId, 
        timestamp: '2026-01-01T00:00:00Z', 
        source: 'UI',
        payload: { x: 1, y: 2, trackOffsetDelta: 0 }
      })
    });
    
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ACCEPTED');

    // Verify DB
    const dbRecord = await prisma.commandRecord.findUnique({ where: { commandId: testCommandId } });
    assert.ok(dbRecord);
    assert.strictEqual(dbRecord.status, 'PENDING');
  });

  it('I. Emergency stop remains permitted', async () => {
    const estopId = `estop-${Date.now()}`;
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ 
        type: 'TRIGGER_EMERGENCY_STOP', 
        id: estopId, 
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
    // First request
    const req1 = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ 
        type: 'TRIGGER_EMERGENCY_STOP', 
        id: duplicateCommandId, 
        timestamp: '2026-01-01T00:00:00Z', 
        source: 'UI'
      })
    });
    await POST(req1);

    // Duplicate request
    const req2 = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ 
        type: 'TRIGGER_EMERGENCY_STOP', 
        id: duplicateCommandId, 
        timestamp: '2026-01-01T00:00:00Z', 
        source: 'UI'
      })
    });
    
    const res2 = await POST(req2);
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.reason, 'Duplicate command submitted');
  });

  it('L. GET command by ID returns persisted record', async () => {
    const req = new Request(`http://localhost/api/robot/command/${testCommandId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    
    const context = { params: Promise.resolve({ id: testCommandId }) };
    const res = await GET(req, context);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.commandId, testCommandId);
    assert.strictEqual(body.status, 'PENDING');
  });

  it('M. IDOR protection for command lookup', async () => {
    // otherUserToken corresponds to a different OPERATOR. They shouldn't be able to read operator 1's command.
    const req = new Request(`http://localhost/api/robot/command/${testCommandId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${otherUserToken}` }
    });
    
    const context = { params: Promise.resolve({ id: testCommandId }) };
    const res = await GET(req, context);
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes('Forbidden'));
  });
});
