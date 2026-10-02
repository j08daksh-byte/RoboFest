import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { telemetrySimulator } from './simulator';
import { SimulationScenario } from './scenarios';
import { usePlatformStore } from '../platformStore';
import { SafetyLevel, MissionStatus, MissionState } from '../domain';

describe('Phase 4C: Simulator Integration (Events + Mission Link)', () => {
  beforeEach(() => {
    usePlatformStore.setState({
      events: [],
      safety: { level: SafetyLevel.NORMAL, activeHazards: [], torchPermission: true, movementPermission: true, emergencyStateActive: false, acknowledgementRequired: false },
      mission: { id: 'TEST-MISSION', status: MissionStatus.IN_PROGRESS } as unknown as MissionState
    });
    telemetrySimulator.setScenario(SimulationScenario.NORMAL_OPERATION);
  });

  it('safety transition creates event & duplicate identical event is not spammed', () => {
    telemetrySimulator.setScenario(SimulationScenario.GAS_WARNING);
    (telemetrySimulator as unknown as { tick: () => void }).tick();
    
    let store = usePlatformStore.getState();
    assert.strictEqual(store.safety.level, SafetyLevel.WARNING);
    
    const initialEventCount = store.events.length;
    assert.ok(initialEventCount >= 2); 
    
    (telemetrySimulator as unknown as { tick: () => void }).tick();
    
    store = usePlatformStore.getState();
    assert.strictEqual(store.events.length, initialEventCount, 'No new events should be spammed');
  });

  it('mission event includes missionId when appropriate', () => {
    (telemetrySimulator as unknown as { tick: () => void }).tick();
    const store = usePlatformStore.getState();
    
    const latestEvent = store.events[0];
    if (latestEvent) {
      assert.strictEqual(latestEvent.missionId, 'TEST-MISSION');
    }
  });
});
