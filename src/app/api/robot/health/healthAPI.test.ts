import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { POST } from './[componentId]/maintenance/route';
import { GET as GET_HEALTH } from './route';
import { GET as GET_ANALYTICS } from '../../analytics/route';
import { signToken } from '@/lib/auth';
import { UserRole } from '@/lib/domain';
import { initializeComponentHealth } from '@/lib/health/healthEngine';

const prisma = new PrismaClient();

describe('Robot Health & Maintenance APIs', () => {
  let operatorToken = '';
  let engineerToken = '';
  let operatorId = '';
  let engineerId = '';

  before(async () => {
    const op = await prisma.user.create({ data: { username: `op_${Date.now()}`, passwordHash: 'hash', role: UserRole.OPERATOR }});
    const eng = await prisma.user.create({ data: { username: `eng_${Date.now()}`, passwordHash: 'hash', role: UserRole.ENGINEER }});
    operatorId = op.id;
    engineerId = eng.id;
    operatorToken = await signToken({ id: operatorId, role: UserRole.OPERATOR });
    engineerToken = await signToken({ id: engineerId, role: UserRole.ENGINEER });
    
    await prisma.maintenanceRecord.deleteMany({});
    await prisma.componentHealth.deleteMany({});
    await initializeComponentHealth();
  });

  after(async () => {
    await prisma.maintenanceRecord.deleteMany({});
    await prisma.componentHealth.deleteMany({});
    await prisma.user.deleteMany({ where: { id: { in: [operatorId, engineerId] } }});
  });

  it('1. GET /health returns initialized components', async () => {
    const req = new Request('http://localhost/api/robot/health', {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    const res = await GET_HEALTH(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.components.length > 0);
  });

  it('2. Maintenance authorization (OPERATOR cannot post)', async () => {
    const req = new Request('http://localhost/api/robot/health/SYS-POWER/maintenance', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` },
      body: JSON.stringify({ maintenanceType: 'INSPECTION', description: 'Test' })
    });
    const res = await POST(req, { params: Promise.resolve({ componentId: 'SYS-POWER' }) });
    assert.strictEqual(res.status, 403);
  });

  it('3. Maintenance persistence (ENGINEER can post)', async () => {
    const req = new Request('http://localhost/api/robot/health/SYS-POWER/maintenance', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${engineerToken}` },
      body: JSON.stringify({ maintenanceType: 'REPLACEMENT', description: 'Replaced batteries' })
    });
    const res = await POST(req, { params: Promise.resolve({ componentId: 'SYS-POWER' }) });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.maintenanceType, 'REPLACEMENT');

    // Verify component health is updated
    const comp = await prisma.componentHealth.findUnique({ where: { componentId: 'SYS-POWER' } });
    assert.strictEqual(comp?.status, 'HEALTHY');
    assert.ok(comp?.lastMaintenanceAt);
  });

  it('4. Analytics API returns valid structure', async () => {
    const req = new Request('http://localhost/api/analytics?timeRange=all', {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    const res = await GET_ANALYTICS(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.ok(body.data.missions);
    assert.ok(body.data.cuts);
  });
});
