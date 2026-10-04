import test from 'node:test';
import assert from 'node:assert';
import { POST, GET } from './route';
import { POST as TransitionPOST } from './[id]/transition/route';
import { PrismaClient } from '@prisma/client';
import { UserRole, MissionStatus } from '@/lib/domain';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();
let validToken = '';

test('Mission API Tests', async (t) => {
  // Clear previous runs
  await prisma.mission.deleteMany({});
  await prisma.componentHealth.deleteMany({});
  await prisma.telemetryRecord.deleteMany({});
  
  const testUser = await prisma.user.upsert({
    where: { id: 'test-user' },
    update: {},
    create: { id: 'test-user', username: 'test_eng', passwordHash: 'hash', role: UserRole.ENGINEER }
  });

  validToken = await signToken({ id: testUser.id, role: testUser.role });

  await prisma.runtimeState.upsert({
    where: { id: 'singleton' },
    update: { emergencyActive: false, activeMissionId: null },
    create: { id: 'singleton', systemMode: 'SIMULATED', emergencyActive: false }
  });

  let missionId: string;

  await t.test('A. create mission defaults to DRAFT', async () => {
    const req = new Request('http://localhost/api/missions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ shipName: 'Test', objective: 'Obj', hullSection: 'A1' })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.status, MissionStatus.DRAFT);
    missionId = body.data.id;
  });

  await t.test('B. unauthorized mission creation rejected', async () => {
    const req = new Request('http://localhost/api/missions', {
      method: 'POST',
      body: JSON.stringify({ shipName: 'Test', objective: 'Obj', hullSection: 'A1' })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 401);
  });

  const runTransition = async (action: string) => {
    const req = new Request(`http://localhost/api/missions/${missionId}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ action })
    });
    return TransitionPOST(req, { params: Promise.resolve({ id: missionId }) });
  };

  await t.test('C. DRAFT -> READY', async () => {
    const res = await runTransition('READY');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, MissionStatus.READY);
  });

  await t.test('D. READY -> RUNNING (sets activeMissionId)', async () => {
    const res = await runTransition('START');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, MissionStatus.RUNNING);

    const rs = await prisma.runtimeState.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(rs?.activeMissionId, missionId);
  });

  await t.test('E. RUNNING -> PAUSED', async () => {
    const res = await runTransition('PAUSE');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, MissionStatus.PAUSED);
  });

  await t.test('F. PAUSED -> RUNNING', async () => {
    const res = await runTransition('RESUME');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, MissionStatus.RUNNING);
  });

  await t.test('K. invalid transition rejected', async () => {
    const res = await runTransition('READY');
    assert.strictEqual(res.status, 400);
  });

  await t.test('G. RUNNING -> COMPLETED (clears activeMissionId)', async () => {
    const res = await runTransition('COMPLETE');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, MissionStatus.COMPLETED);

    const rs = await prisma.runtimeState.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(rs?.activeMissionId, null);
  });

  await t.test('L. terminal mission cannot restart', async () => {
    const res = await runTransition('START');
    assert.strictEqual(res.status, 400);
  });

  await t.test('H/I/J/M/N/O/P. active emergency stop blocks mission start', async () => {
    await prisma.runtimeState.update({ where: { id: 'singleton' }, data: { emergencyActive: true } });
    
    // Create new mission
    const req = new Request('http://localhost/api/missions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ shipName: 'T2', objective: 'O2', hullSection: 'B2' })
    });
    const res = await POST(req);
    const m2Id = (await res.json()).data.id;
    
    // Draft -> Ready
    const rReq = new Request(`http://localhost/api/missions/${m2Id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ action: 'READY' })
    });
    await TransitionPOST(rReq, { params: Promise.resolve({ id: m2Id }) });

    // Ready -> Start should fail due to E-Stop
    const sReq = new Request(`http://localhost/api/missions/${m2Id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ action: 'START' })
    });
    const sRes = await TransitionPOST(sReq, { params: Promise.resolve({ id: m2Id }) });
    assert.strictEqual(sRes.status, 409);
    const err = await sRes.json();
    assert.strictEqual(err.error, 'Safety failure: Emergency Stop is currently active. Operation blocked.');
  });

  await t.test('S. duplicate/concurrent start cannot create multiple active missions', async () => {
    await prisma.runtimeState.update({ where: { id: 'singleton' }, data: { emergencyActive: false } });

    // m3 is already READY (from prev test) wait, previous test was m2Id. Let's start m2Id
    const m2 = await prisma.mission.findFirst({ where: { shipName: 'T2' }});
    assert.ok(m2);

    const startReq1 = new Request(`http://localhost/api/missions/${m2.id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ action: 'START' })
    });
    await TransitionPOST(startReq1, { params: Promise.resolve({ id: m2.id }) });

    // Create m4 and ready it
    const cReq = new Request('http://localhost/api/missions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ shipName: 'T4', objective: 'O4', hullSection: 'B4' })
    });
    const m4Id = (await (await POST(cReq)).json()).data.id;
    
    const readyReq = new Request(`http://localhost/api/missions/${m4Id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ action: 'READY' })
    });
    await TransitionPOST(readyReq, { params: Promise.resolve({ id: m4Id }) });

    // Start m4 -> should fail because m2 is active
    const startReq2 = new Request(`http://localhost/api/missions/${m4Id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ action: 'START' })
    });
    const startRes = await TransitionPOST(startReq2, { params: Promise.resolve({ id: m4Id }) });
    assert.strictEqual(startRes.status, 409);
  });
});
