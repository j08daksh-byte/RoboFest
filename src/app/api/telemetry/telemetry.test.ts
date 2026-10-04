import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth';
import { UserRole, SystemMode } from '@/lib/domain';

const prisma = new PrismaClient();

const POST = async (req: Request) => {
  const { POST: postHandler } = await import('./route');
  return postHandler(req);
};

const GET = async (req: Request) => {
  const { GET: getHandler } = await import('./route');
  return getHandler(req);
};

const GET_LATEST = async (req: Request) => {
  const { GET: getHandler } = await import('./latest/route');
  return getHandler(req);
};

let validToken = '';

test('Telemetry API Tests', async (t) => {
  const testUser = await prisma.user.upsert({
    where: { id: 'telemetry-tester' },
    update: {},
    create: { id: 'telemetry-tester', username: 'telemetry_eng', passwordHash: 'hash', role: UserRole.ENGINEER }
  });
  validToken = await signToken({ id: testUser.id, role: testUser.role });

  await prisma.telemetryRecord.deleteMany({});
  await prisma.eventLog.deleteMany({});

  await t.test('A. Rejects unauthorized', async () => {
    const req = new Request(`http://localhost/api/telemetry`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 401);
  });

  await t.test('B. Rejects missing mode/source', async () => {
    const req = new Request(`http://localhost/api/telemetry`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({})
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
  });

  await t.test('C. Rejects LIVE telemetry from browser/standard ingestion', async () => {
    const req = new Request(`http://localhost/api/telemetry`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ source: 'SIMULATOR', mode: SystemMode.LIVE })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 403);
  });

  await t.test('D. Accepts SIMULATED telemetry', async () => {
    const req = new Request(`http://localhost/api/telemetry`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ 
        source: 'SIMULATOR', 
        mode: SystemMode.SIMULATED,
        robot: { powerVoltage: 220, overallHealth: 'GOOD' }
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 201);
    
    // Check DB
    const count = await prisma.telemetryRecord.count();
    assert.strictEqual(count, 1);
  });

  await t.test('E. Generates event for critical health anomaly', async () => {
    const req = new Request(`http://localhost/api/telemetry`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ 
        source: 'SIMULATOR', 
        mode: SystemMode.SIMULATED,
        robot: { overallHealth: 'CRITICAL' }
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 201);
    
    // Check EventLog
    const event = await prisma.eventLog.findFirst({ where: { category: 'TELEMETRY' } });
    assert.ok(event);
    assert.strictEqual(event?.severity, 'CRITICAL');
  });

  await t.test('F. GET /api/telemetry returns bounded history', async () => {
    const req = new Request(`http://localhost/api/telemetry?mode=SIMULATED&limit=2`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.length, 2);
  });

  await t.test('G. GET /api/telemetry/latest returns the most recent sample', async () => {
    const req = new Request(`http://localhost/api/telemetry/latest?mode=SIMULATED`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const res = await GET_LATEST(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.overallHealth, 'CRITICAL'); // Since it was the last one added
  });
});
