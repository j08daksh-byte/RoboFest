import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();

test('Events API Tests', async (t) => {
  await prisma.eventLog.deleteMany({});
  
  const user = await prisma.user.create({
    data: {
      username: `test_event_op_${Date.now()}`,
      passwordHash: 'fakehash',
      role: 'OPERATOR'
    }
  });
  const validToken = await signToken({ id: user.id, role: user.role });
  
  let createdEventId: string;

  await t.test('1. Unauthenticated creation returns 401', async () => {
    const req = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ category: 'SYSTEM', severity: 'INFO', message: 'Test' })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 401);
  });

  await t.test('2. Creates event with valid payload', async () => {
    const req = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${validToken}` },
      body: JSON.stringify({ category: 'SYSTEM', type: 'TEST', severity: 'INFO', message: 'Test Event', source: 'TEST' })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.data.id);
    createdEventId = data.data.id;
  });

  await t.test('3. Query limits bounds (default 100)', async () => {
    const req = new NextRequest('http://localhost/api/events', {
      method: 'GET',
      headers: { 'authorization': `Bearer ${validToken}` }
    });
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.meta.limit, 100);
    assert.ok(data.data.length > 0);
  });

  await t.test('4. Filters work correctly', async () => {
    const req = new NextRequest('http://localhost/api/events?category=SYSTEM&type=TEST', {
      method: 'GET',
      headers: { 'authorization': `Bearer ${validToken}` }
    });
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.data.some((e: any) => e.id === createdEventId));
    assert.strictEqual(data.data[0].category, 'SYSTEM');
  });
});
