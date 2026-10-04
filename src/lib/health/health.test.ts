import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { evaluateSystemHealth, initializeComponentHealth } from './healthEngine';

const prisma = new PrismaClient();

const baseTelemetry = {
  powerVoltage: 240, powerCurrent: 10,
  motorTempLeft: 40, motorTempRight: 45, motorCurrentLeft: 10, motorCurrentRight: 10,
  torchStatus: 'OFF', oxyPressurePsi: 150, oxyFlowRate: 0, acePressurePsi: 15, aceFlowRate: 0,
  imuAccelX: 0, imuAccelY: 0, imuAccelZ: 9.8, imuGyroX: 0, imuGyroY: 0, imuGyroZ: 0, imuTiltAngle: 5,
  electromagnetEnabled: true, electromagnetCurrent: 5.0,
  armExtensionX: 0, armExtensionY: 0, vibrationLevel: 0.5,
  source: 'TEST', envTemperatureC: 20, envHumidity: 50, envAtmosphericPressure: 1013, envWindSpeed: 0, envRain: false, envVisibility: 'CLEAR', envO2Percentage: 21, envCoPpm: 0, envCo2Ppm: 400, envCombustibleGasLel: 0, positionX: 0, positionY: 0, positionZ: 0
};

describe('Robot Health & Predictive Maintenance', () => {
  before(async () => {
    await prisma.maintenanceRecord.deleteMany({});
    await prisma.componentHealth.deleteMany({});
    await prisma.telemetryRecord.deleteMany({ where: { source: 'TEST' } });
    await initializeComponentHealth();
  });

  after(async () => {
    await prisma.maintenanceRecord.deleteMany({});
    await prisma.componentHealth.deleteMany({});
    await prisma.telemetryRecord.deleteMany({ where: { source: 'TEST' } });
  });

  it('1. Missing telemetry evaluates to UNKNOWN', async () => {
    await evaluateSystemHealth(null);
    const comps = await prisma.componentHealth.findMany();
    for (const c of comps) {
      assert.strictEqual(c.status, 'UNKNOWN');
      assert.strictEqual(c.faultState, 'No Telemetry');
    }
  });

  it('2. Valid telemetry evaluates deterministic health', async () => {
    // Fake telemetry
    const telemetry: any = {
      ...baseTelemetry,
      id: 'tele-1',
      mode: 'SIMULATED',
      timestamp: new Date()
    };
    
    // ensure telemetry record exists for update
    const t = await prisma.telemetryRecord.create({ data: telemetry });

    await evaluateSystemHealth(t);
    
    const comps = await prisma.componentHealth.findMany();
    for (const c of comps) {
      assert.strictEqual(c.status, 'HEALTHY');
    }
  });

  it('3. Threshold warning detection (e.g. Low Voltage)', async () => {
    const telemetry: any = {
      ...baseTelemetry,
      id: 'tele-warn',
      mode: 'SIMULATED',
      powerVoltage: 205, // Below 210, WARNING
      timestamp: new Date()
    };
    const t = await prisma.telemetryRecord.create({ data: telemetry });

    await evaluateSystemHealth(t);
    const comp = await prisma.componentHealth.findUnique({ where: { componentId: 'SYS-POWER' } });
    assert.strictEqual(comp?.status, 'WARNING');
  });

  it('4. Fault detection (e.g. Motor Overheat)', async () => {
    const telemetry: any = {
      ...baseTelemetry,
      id: 'tele-fault',
      mode: 'SIMULATED',
      motorTempLeft: 80, // CRITICAL (over 75)
      timestamp: new Date()
    };
    const t = await prisma.telemetryRecord.create({ data: telemetry });

    await evaluateSystemHealth(t);
    const comp = await prisma.componentHealth.findUnique({ where: { componentId: 'MOT-DRIVE' } });
    assert.strictEqual(comp?.status, 'FAULT');
  });

});
