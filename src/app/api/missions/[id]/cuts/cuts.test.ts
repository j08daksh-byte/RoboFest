import test from 'node:test';
import assert from 'node:assert';
import { POST, GET } from './route';
import { GET as CutGET } from './[cutId]/route';
import { POST as TransitionPOST } from './[cutId]/transition/route';
import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth';
import { UserRole } from '@/lib/domain';

const prisma = new PrismaClient();
let validToken = '';

test('Cut API Tests', async (t) => {
  const testUser = await prisma.user.upsert({
    where: { id: 'test-user-cuts' },
    update: {},
    create: { id: 'test-user-cuts', username: 'test_eng_cuts', passwordHash: 'hash', role: UserRole.ENGINEER }
  });
  validToken = await signToken({ id: testUser.id, role: testUser.role });

  const mission = await prisma.mission.create({
    data: { shipName: 'Test Ship', objective: 'Test Obj', hullSection: 'A1', status: 'RUNNING' }
  });

  await prisma.runtimeState.upsert({
    where: { id: 'singleton' },
    update: { activeMissionId: mission.id, emergencyActive: false },
    create: { id: 'singleton', activeMissionId: mission.id, emergencyActive: false }
  });

  let cutId1: string;
  let cutId2: string;

  await t.test('A. POST /cuts creates a PLANNED cut', async () => {
    const req = new Request(`http://localhost/api/missions/${mission.id}/cuts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ type: 'CLOSED_LOOP', normalizedJson: '{}' })
    });
    const res = await POST(req, { params: Promise.resolve({ id: mission.id }) });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.status, 'PLANNED');
    cutId1 = body.data.id;
  });

  await t.test('B. POST /cuts rejects missing geometry', async () => {
    const req = new Request(`http://localhost/api/missions/${mission.id}/cuts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ type: 'CLOSED_LOOP' }) // missing geometry
    });
    const res = await POST(req, { params: Promise.resolve({ id: mission.id }) });
    assert.strictEqual(res.status, 400);
  });

  await t.test('C. GET /cuts returns list of cuts', async () => {
    const req = new Request(`http://localhost/api/missions/${mission.id}/cuts`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const res = await GET(req, { params: Promise.resolve({ id: mission.id }) });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.length, 1);
  });

  await t.test('D. GET /cuts/[cutId] returns specific cut', async () => {
    const req = new Request(`http://localhost/api/missions/${mission.id}/cuts/${cutId1}`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const res = await CutGET(req, { params: Promise.resolve({ id: mission.id, cutId: cutId1 }) });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.id, cutId1);
  });

  const runTransition = async (cutId: string, action: string) => {
    const req = new Request(`http://localhost/api/missions/${mission.id}/cuts/${cutId}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ action })
    });
    return TransitionPOST(req, { params: Promise.resolve({ id: mission.id, cutId }) });
  };

  await t.test('E. PLANNED -> READY', async () => {
    const res = await runTransition(cutId1, 'PREPARE');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, 'READY');
  });

  await t.test('F. READY -> PENDING', async () => {
    const res = await runTransition(cutId1, 'QUEUE');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, 'PENDING');
  });

  await t.test('G. PENDING -> COMPLETED', async () => {
    const res = await runTransition(cutId1, 'COMPLETE');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, 'COMPLETED');
  });

  await t.test('H. COMPLETED cannot transition to READY', async () => {
    const res = await runTransition(cutId1, 'PREPARE');
    assert.strictEqual(res.status, 400);
  });

  await t.test('I. Multiple independent cuts', async () => {
    const req = new Request(`http://localhost/api/missions/${mission.id}/cuts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ type: 'OPEN_PATH', normalizedJson: '{}' })
    });
    const res = await POST(req, { params: Promise.resolve({ id: mission.id }) });
    cutId2 = (await res.json()).data.id;
    assert.notStrictEqual(cutId1, cutId2);
  });
});
