import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { telemetrySimulator } from './simulator';
import { SimulationScenario } from './scenarios';
import { usePlatformStore } from '../platformStore';
import { SafetyLevel, MissionStatus, MissionState } from '../domain';
import { PlatformTelemetry } from '../transport/domain';

describe('Phase 4C: Simulator Integration (Events + Mission Link)', () => {
  beforeEach(() => {
    usePlatformStore.setState({
      events: [],
      safety: { level: SafetyLevel.NORMAL, activeHazards: [], torchPermission: true, movementPermission: true, emergencyStateActive: false, acknowledgementRequired: false },
      mission: { id: 'TEST-MISSION', status: MissionStatus.RUNNING } as unknown as MissionState,
      telemetryHistory: []
    });
    telemetrySimulator.setScenario(SimulationScenario.NORMAL_OPERATION);
    telemetrySimulator.start(() => ({
      sensor: usePlatformStore.getState().sensor,
      environment: usePlatformStore.getState().environment,
      safety: usePlatformStore.getState().safety,
      missionId: usePlatformStore.getState().mission.id || undefined,
      systemMode: usePlatformStore.getState().systemMode,
      powerVoltage: 220,
      powerCurrent: 3.5
    }), (t: PlatformTelemetry) => {
      usePlatformStore.getState().applyTelemetry(t);
    });
  });

  afterEach(() => {
    telemetrySimulator.stop();
  });

  it('safety transition creates event & duplicate identical event is not spammed', () => {
    telemetrySimulator.setScenario(SimulationScenario.GAS_WARNING);
    (telemetrySimulator as any).tick();
    
    let store = usePlatformStore.getState();
    assert.strictEqual(store.safety.level, SafetyLevel.WARNING);
    
    const initialEventCount = store.events.length;
    assert.ok(initialEventCount >= 2); 
    
    (telemetrySimulator as any).tick();
    
    store = usePlatformStore.getState();
    assert.strictEqual(store.events.length, initialEventCount, 'No new events should be spammed');
  });

  it('mission event includes missionId when appropriate', () => {
    (telemetrySimulator as any).tick();
    const store = usePlatformStore.getState();
    
    const latestEvent = store.events[0];
    if (latestEvent) {
      assert.strictEqual(latestEvent.missionId, 'TEST-MISSION');
    }
  });

  it('tick appends a telemetry sample to history', () => {
    const storeBefore = usePlatformStore.getState();
    const historyLengthBefore = storeBefore.telemetryHistory.length;

    (telemetrySimulator as any).tick();

    const storeAfter = usePlatformStore.getState();
    assert.strictEqual(storeAfter.telemetryHistory.length, historyLengthBefore + 1);
  });
});
