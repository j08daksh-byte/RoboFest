import { describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluateSafetyState } from './safetyEngine';
import { SensorState, EnvironmentState, SafetyLevel } from '../domain';
import { DEMO_THRESHOLDS } from './safetyRules';

const createMockSensor = (overrides?: Partial<SensorState>): SensorState => ({
  metadata: { isSimulated: true, isStale: false, lastUpdated: new Date().toISOString() },
  imu: { acceleration: { x: 0, y: -9.81, z: 0 }, gyro: { x: 0, y: 0, z: 0 }, tiltAngle: 0 },
  motors: { currentLeft: 0, currentRight: 0, tempLeft: 20, tempRight: 20 },
  hardware: { electromagnetCurrent: 5, armExtensionY: 0, armExtensionX: 0, vibrationLevel: 0 },
  gas: { torchStatus: 'OFF', oxyPressurePsi: 100, oxyFlowRate: 0, acePressurePsi: 10, aceFlowRate: 0 },
  ...overrides
});

const createMockEnv = (overrides?: Partial<EnvironmentState>): EnvironmentState => ({
  temperatureC: 22,
  humidityPercentage: 45,
  windSpeedKmh: 10,
  rain: false,
  visibilityStatus: 'CLEAR',
  atmosphericPressureHpa: 1013,
  stormWorkabilityState: 'WORKABLE',
  o2Percentage: 20.9,
  coPpm: 0,
  co2Ppm: 400,
  combustibleGasLel: 0,
  ...overrides
});

describe('Deterministic Safety Engine', () => {
  it('normal telemetry -> NORMAL', () => {
    const res = evaluateSafetyState(createMockSensor(), createMockEnv(), false);
    assert.strictEqual(res.state.level, SafetyLevel.NORMAL);
    assert.strictEqual(res.state.torchPermission, true);
    assert.strictEqual(res.state.movementPermission, true);
    assert.strictEqual(res.state.activeHazards.length, 0);
  });

  it('warning gas scenario -> WARNING', () => {
    const env = createMockEnv({ combustibleGasLel: DEMO_THRESHOLDS.GAS_COMBUSTIBLE_WARNING + 2 });
    const res = evaluateSafetyState(createMockSensor(), env, false);
    assert.strictEqual(res.state.level, SafetyLevel.WARNING);
    assert.strictEqual(res.state.torchPermission, true);
    assert.strictEqual(res.state.movementPermission, true);
  });

  it('critical gas scenario -> EVACUATION (Combustible Gas)', () => {
    const env = createMockEnv({ combustibleGasLel: DEMO_THRESHOLDS.GAS_COMBUSTIBLE_CRITICAL + 1 });
    const res = evaluateSafetyState(createMockSensor(), env, false);
    assert.strictEqual(res.state.level, SafetyLevel.EVACUATION);
    assert.strictEqual(res.state.torchPermission, false);
    assert.strictEqual(res.state.movementPermission, false);
  });

  it('motor overheating -> ROBOT_STOP', () => {
    const sensor = createMockSensor({
      motors: { currentLeft: 0, currentRight: 0, tempLeft: DEMO_THRESHOLDS.MOTOR_TEMP_CRITICAL + 5, tempRight: 20 }
    });
    const res = evaluateSafetyState(sensor, createMockEnv(), false);
    assert.strictEqual(res.state.level, SafetyLevel.ROBOT_STOP);
    assert.strictEqual(res.state.torchPermission, false);
    assert.strictEqual(res.state.movementPermission, false);
  });

  it('excessive tilt -> ROBOT_STOP', () => {
    const sensor = createMockSensor({
      imu: { acceleration: { x: 0, y: 0, z: 0 }, gyro: { x: 0, y: 0, z: 0 }, tiltAngle: DEMO_THRESHOLDS.TILT_CRITICAL + 2 }
    });
    const res = evaluateSafetyState(sensor, createMockEnv(), false);
    assert.strictEqual(res.state.level, SafetyLevel.ROBOT_STOP);
    assert.strictEqual(res.state.torchPermission, false);
    assert.strictEqual(res.state.movementPermission, false);
  });

  it('emergency stop -> EVACUATION', () => {
    const res = evaluateSafetyState(createMockSensor(), createMockEnv(), true);
    assert.strictEqual(res.state.level, SafetyLevel.EVACUATION);
    assert.strictEqual(res.state.emergencyStateActive, true);
    assert.strictEqual(res.state.torchPermission, false);
    assert.strictEqual(res.state.movementPermission, false);
  });

  it('higher-priority hazard dominates lower-priority hazard', () => {
    // Both Warning (Tilt) and Critical (O2 Low)
    const sensor = createMockSensor({
      imu: { acceleration: { x: 0, y: 0, z: 0 }, gyro: { x: 0, y: 0, z: 0 }, tiltAngle: DEMO_THRESHOLDS.TILT_WARNING + 1 }
    });
    const env = createMockEnv({
      o2Percentage: DEMO_THRESHOLDS.GAS_O2_CRITICAL_LOW - 1
    });
    const res = evaluateSafetyState(sensor, env, false);
    assert.strictEqual(res.state.level, SafetyLevel.EVACUATION); 
  });
});
