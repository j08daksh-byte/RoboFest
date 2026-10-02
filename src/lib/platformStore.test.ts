import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { usePlatformStore } from './platformStore';
import { MissionStatus, SystemEvent, EventCategory, TelemetrySample } from './domain';

describe('Phase 4C: Mission Lifecycle + Telemetry History', () => {
  beforeEach(() => {
    // Reset store state
    usePlatformStore.setState({
      mission: {
        id: null,
        shipName: '',
        hullSection: '',
        objective: '',
        status: MissionStatus.PLANNED,
        progressPercentage: 0,
        startTime: null,
        estimatedCompletionTime: null,
        currentCutReference: null,
        createdAt: null,
        updatedAt: null
      },
      telemetryHistory: [],
      events: []
    });
  });

  it('create mission', () => {
    const store = usePlatformStore.getState();
    const res = store.createMission({ shipName: 'Test Ship', hullSection: 'A1' });
    assert.strictEqual(res.success, true);
    const newMission = usePlatformStore.getState().mission;
    assert.strictEqual(newMission.shipName, 'Test Ship');
    assert.strictEqual(newMission.status, MissionStatus.PLANNED);
    assert.ok(newMission.createdAt);
  });

  it('planned -> in_progress', () => {
    const store = usePlatformStore.getState();
    store.createMission({ shipName: 'Test Ship' });
    const res = usePlatformStore.getState().startMission();
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.IN_PROGRESS);
    assert.ok(usePlatformStore.getState().mission.startTime);
  });

  it('in_progress -> completed', () => {
    const store = usePlatformStore.getState();
    store.createMission({ shipName: 'Test Ship' });
    store.startMission();
    const res = usePlatformStore.getState().completeMission();
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.COMPLETED);
    assert.strictEqual(usePlatformStore.getState().mission.progressPercentage, 100);
  });

  it('invalid completed -> in_progress', () => {
    const store = usePlatformStore.getState();
    store.createMission({ shipName: 'Test Ship' });
    store.startMission();
    store.completeMission();
    const res = usePlatformStore.getState().startMission();
    assert.strictEqual(res.success, false);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.COMPLETED);
  });

  it('invalid cancelled -> completed', () => {
    const store = usePlatformStore.getState();
    store.createMission({ shipName: 'Test Ship' });
    store.cancelMission();
    const res = usePlatformStore.getState().completeMission();
    assert.strictEqual(res.success, false);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.CANCELLED);
  });

  it('progress boundaries', () => {
    const store = usePlatformStore.getState();
    store.createMission({ shipName: 'Test Ship' });
    store.startMission();
    let res = usePlatformStore.getState().setMissionProgress(50);
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.progressPercentage, 50);

    res = usePlatformStore.getState().setMissionProgress(150);
    assert.strictEqual(res.success, false); // Out of bounds
    assert.strictEqual(usePlatformStore.getState().mission.progressPercentage, 50);
  });

  it('bounded telemetry history', () => {
    // Insert 150 samples
    for (let i = 0; i < 150; i++) {
      usePlatformStore.getState().addTelemetrySample({} as unknown as TelemetrySample);
    }
    assert.strictEqual(usePlatformStore.getState().telemetryHistory.length, 100); // MAX_HISTORY = 100
  });

  it('event history remains bounded', () => {
    for (let i = 0; i < 150; i++) {
      usePlatformStore.getState().addSystemEvent({ id: i.toString() } as unknown as SystemEvent);
    }
    assert.strictEqual(usePlatformStore.getState().events.length, 100);
  });
});
