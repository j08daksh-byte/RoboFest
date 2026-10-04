import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { GET, PATCH } from './route';
import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();

describe('Runtime State API Integration Tests', () => {
  let validToken = '';
  let operatorId = '';

  before(async () => {
    // Create test user
    const operator = await prisma.user.create({
      data: {
        username: `testop_state_${Date.now()}`,
        passwordHash: 'fakehash',
        role: 'OPERATOR'
      }
    });
    operatorId = operator.id;
    validToken = await signToken({ id: operator.id, role: operator.role });
    
    // Ensure clean state
    await prisma.runtimeState.deleteMany();
  });

  after(async () => {
    await prisma.runtimeState.deleteMany();
    await prisma.user.deleteMany({
      where: { id: operatorId }
    });
    await prisma.$disconnect();
  });

  it('1. GET /api/robot/state creates singleton if missing and returns it', async () => {
    const req = new Request('http://localhost/api/robot/state', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    
    const res = await GET(req, {});
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.id, 'singleton');
    assert.strictEqual(body.systemMode, 'SIMULATED');
  });

  it('2. PATCH /api/robot/state updates allowed fields', async () => {
    const req = new Request('http://localhost/api/robot/state', {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emergencyActive: true, systemMode: 'LIVE' })
    });
    
    const res = await PATCH(req, {});
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.emergencyActive, true);
    assert.strictEqual(body.systemMode, 'LIVE');
    assert.strictEqual(body.stateVersion, 1);
  });

  it('3. PATCH /api/robot/state in LIVE mode ignores physical actuator state mutations', async () => {
    const req = new Request('http://localhost/api/robot/state', {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ torchEnabled: true, positionX: 100 })
    });
    
    const res = await PATCH(req, {});
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    
    // Should NOT be updated because it's in LIVE mode!
    assert.strictEqual(body.torchEnabled, false); 
    assert.strictEqual(body.positionX, 0); 
    assert.strictEqual(body.stateVersion, 2);
  });

  it('4. PATCH /api/robot/state rejects unauthorized', async () => {
    const badToken = await signToken({ id: operatorId, role: 'GUEST' });
    const req = new Request('http://localhost/api/robot/state', {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${badToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emergencyActive: false })
    });
    
    const res = await PATCH(req, {});
    assert.strictEqual(res.status, 403);
  });
});
