import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { evaluateServerSafety } from './serverSafety';
import { POST as CommandPOST } from '@/app/api/robot/command/route';
import { POST as MissionTransitionPOST } from '@/app/api/missions/[id]/transition/route';
import { POST as CutTransitionPOST } from '@/app/api/missions/[id]/cuts/[cutId]/transition/route';
import { signToken } from '@/lib/auth';
import { UserRole } from '@/lib/domain';

const prisma = new PrismaClient();

describe('Deterministic Safety Backend', () => {
  let engToken = '';
  let engUserId = '';
  let opToken = '';
  let opUserId = '';

  before(async () => {
    await prisma.telemetryRecord.deleteMany({});
    await prisma.eventLog.deleteMany({});
    await prisma.componentHealth.deleteMany({});

    const engineer = await prisma.user.upsert({
      where: { id: 'safety-eng-1' },
      update: {},
      create: { id: 'safety-eng-1', username: 'safety_eng', passwordHash: 'hash', role: UserRole.ENGINEER }
    });
    engUserId = engineer.id;
    engToken = await signToken({ id: engineer.id, role: engineer.role });

    const operator = await prisma.user.upsert({
      where: { id: 'safety-op-1' },
      update: {},
      create: { id: 'safety-op-1', username: 'safety_op', passwordHash: 'hash', role: UserRole.OPERATOR }
    });
    opUserId = operator.id;
    opToken = await signToken({ id: operator.id, role: operator.role });

    await prisma.runtimeState.upsert({
      where: { id: 'singleton' },
      update: { emergencyActive: false, activeMissionId: null },
      create: { id: 'singleton', systemMode: 'SIMULATED' }
    });

    await prisma.eventLog.deleteMany({});
    await prisma.telemetryRecord.deleteMany({});
  });

  after(async () => {
    // Reset state
    await prisma.runtimeState.update({
      where: { id: 'singleton' },
      data: { emergencyActive: false, activeMissionId: null }
    });
    await prisma.telemetryRecord.deleteMany({});
  });

  it('1. Emergency assertion sets state and logs event', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opToken}` },
      body: JSON.stringify({
        id: `estop-cmd-${Date.now()}`,
        type: 'TRIGGER_EMERGENCY_STOP',
        timestamp: new Date().toISOString(),
        source: 'UI'
      })
    });
    const res = await CommandPOST(req);
    assert.strictEqual(res.status, 200);

    const state = await prisma.runtimeState.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(state?.emergencyActive, true);

    const event = await prisma.eventLog.findFirst({
      where: { message: 'SAFETY_ESTOP_ASSERTED' }
    });
    assert.ok(event);
  });

  it('2. E-Stop clear authorization: OPERATOR cannot clear', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opToken}` },
      body: JSON.stringify({
        id: `clear-estop-op-${Date.now()}`,
        type: 'CLEAR_EMERGENCY_STOP',
        timestamp: new Date().toISOString(),
        source: 'UI'
      })
    });
    const res = await CommandPOST(req);
    assert.strictEqual(res.status, 403);
    const body = await res.json() as any;
    assert.ok(body.reason.includes('Insufficient permissions'));

    const state = await prisma.runtimeState.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(state?.emergencyActive, true);
  });

  it('3. E-Stop clear authorization: ENGINEER can clear', async () => {
    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${engToken}` },
      body: JSON.stringify({
        id: `clear-estop-eng-${Date.now()}`,
        type: 'CLEAR_EMERGENCY_STOP',
        timestamp: new Date().toISOString(),
        source: 'UI'
      })
    });
    const res = await CommandPOST(req);
    assert.strictEqual(res.status, 200);

    const state = await prisma.runtimeState.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(state?.emergencyActive, false);
    
    const event = await prisma.eventLog.findFirst({
      where: { message: 'SAFETY_ESTOP_CLEARED' }
    });
    assert.ok(event);
  });

  it('4. Emergency blocks mission start', async () => {
    // Assert E-Stop
    await prisma.runtimeState.update({ where: { id: 'singleton' }, data: { emergencyActive: true } });

    const mission = await prisma.mission.create({
      data: { shipName: 'Test', status: 'READY', objective: 'Test', hullSection: 'Test' }
    });

    const req = new Request(`http://localhost/api/missions/${mission.id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opToken}` },
      body: JSON.stringify({ action: 'START' })
    });
    const res = await MissionTransitionPOST(req, { params: Promise.resolve({ id: mission.id }) });
    assert.strictEqual(res.status, 409);
    const body = await res.json() as any;
    assert.ok(body.error.includes('Emergency Stop is currently active'));
  });

  it('5. Emergency blocks cut start', async () => {
    const mission = await prisma.mission.create({
      data: { shipName: 'Test Cut', status: 'RUNNING', objective: 'Test', hullSection: 'Test' }
    });
    await prisma.runtimeState.update({ where: { id: 'singleton' }, data: { emergencyActive: true, activeMissionId: mission.id } });

    const cut = await prisma.cutRecord.create({
      data: {
        missionId: mission.id,
        name: 'cut-1',
        type: 'CLOSED_LOOP',
        status: 'READY',
        photoPlanJson: '{}', normalizedJson: '{}', worldJson: '{}', panelId: '1'
      }
    });

    const req = new Request(`http://localhost/api/missions/${mission.id}/cuts/${cut.id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opToken}` },
      body: JSON.stringify({ action: 'SIMULATE' })
    });
    const res = await CutTransitionPOST(req, { params: Promise.resolve({ id: mission.id, cutId: cut.id }) });
    assert.strictEqual(res.status, 409);
  });

  it('6. Emergency blocks dangerous commands', async () => {
    await prisma.runtimeState.update({ where: { id: 'singleton' }, data: { emergencyActive: true } });

    const req = new Request('http://localhost/api/robot/command', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opToken}` },
      body: JSON.stringify({
        id: `dang-cmd-${Date.now()}`,
        type: 'SET_TORCH',
        payload: { enabled: true },
        timestamp: new Date().toISOString(),
        source: 'UI'
      })
    });
    const res = await CommandPOST(req);
    assert.strictEqual(res.status, 403);
    const body = await res.json() as any;
    assert.ok(body.reason.includes('Emergency Stop is currently active'));
  });

  it('7. Unsafe telemetry hazard blocks operation', async () => {
    // Clear estop
    await prisma.runtimeState.update({ where: { id: 'singleton' }, data: { emergencyActive: false } });

    // Inject dangerous telemetry (Combustible Gas CRITICAL)
    await prisma.telemetryRecord.create({
      data: {
        source: 'SIMULATOR',
        mode: 'SIMULATED',
        envCombustibleGasLel: 50, // Critical
        // Fill mandatory defaults
        powerVoltage: 220, powerCurrent: 0,
        imuAccelX: 0, imuAccelY: 0, imuAccelZ: 0,
        imuGyroX: 0, imuGyroY: 0, imuGyroZ: 0, imuTiltAngle: 0,
        motorCurrentLeft: 0, motorCurrentRight: 0, motorTempLeft: 0, motorTempRight: 0,
        electromagnetCurrent: 0, armExtensionY: 0, armExtensionX: 0, vibrationLevel: 0, torchStatus: 'OFF',
        oxyPressurePsi: 0, oxyFlowRate: 0, acePressurePsi: 0, aceFlowRate: 0,
        envTemperatureC: 0, envHumidity: 0, envAtmosphericPressure: 0, envWindSpeed: 0, envRain: false,
        envVisibility: 'CLEAR', envO2Percentage: 21, envCoPpm: 0, envCo2Ppm: 0
      }
    });

    const mission = await prisma.mission.create({
      data: { shipName: 'Test Saf', status: 'READY', objective: 'Test', hullSection: 'Test' }
    });

    const req = new Request(`http://localhost/api/missions/${mission.id}/transition`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opToken}` },
      body: JSON.stringify({ action: 'START' })
    });
    const res = await MissionTransitionPOST(req, { params: Promise.resolve({ id: mission.id }) });
    
    assert.strictEqual(res.status, 409);
    const body = await res.json() as any;
    assert.ok(body.error.includes('Safety failure'));
    assert.ok(body.error.includes('combustible'));
  });
});
