import test from 'node:test';
import assert from 'node:assert';
import { usePlatformStore } from './platformStore';
import { MissionStatus, SystemEvent, EventCategory, TelemetrySample } from './domain';

test('platformStore', async (t) => {
  // Mock global fetch
  const originalFetch = global.fetch;
  global.fetch = async (url: any, options: any) => {
    let mockData: any = { id: 'MIS-1', status: MissionStatus.DRAFT };
    if (typeof url === 'string' && url.endsWith('/api/missions')) {
      const body = JSON.parse(options.body || '{}');
      mockData = { ...mockData, ...body };
    }
    if (typeof url === 'string' && url.includes('transition')) {
      const body = JSON.parse(options.body);
      let status = MissionStatus.DRAFT;
      if (body.action === 'READY') status = MissionStatus.READY;
      if (body.action === 'START' || body.action === 'RESUME') status = MissionStatus.RUNNING;
      if (body.action === 'PAUSE') status = MissionStatus.PAUSED;
      if (body.action === 'COMPLETE') status = MissionStatus.COMPLETED;
      if (body.action === 'ABORT') status = MissionStatus.ABORTED;
      mockData = { id: 'MIS-1', status };
    }
    return {
      ok: true,
      json: async () => ({ data: mockData })
    } as any;
  };
  // Mock localStorage
  (global as any).localStorage = { getItem: () => null };

  t.afterEach(() => {
    usePlatformStore.setState({
      mission: {
        id: null,
        shipName: '',
        hullSection: '',
        objective: '',
        status: MissionStatus.DRAFT,
        progressPercentage: 0,
        startTime: null,
        estimatedCompletionTime: null,
        currentCutReference: null,
        createdAt: null,
        updatedAt: null
      },
      robot: { activeMissionId: null } as any
    });
  });

  await t.test('createMission works', async () => {
    const store = usePlatformStore.getState();
    const res = await store.createMission({ shipName: 'Test Ship', hullSection: 'A1' });
    assert.strictEqual(res.success, true);
    const newMission = usePlatformStore.getState().mission;
    assert.strictEqual(newMission.shipName, 'Test Ship');
  });

  await t.test('startMission updates status', async () => {
    const store = usePlatformStore.getState();
    await store.createMission({ shipName: 'Test Ship' });
    const res = await usePlatformStore.getState().startMission();
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.RUNNING);
  });

  await t.test('completeMission marks completion', async () => {
    const store = usePlatformStore.getState();
    await store.createMission({ shipName: 'Test Ship' });
    await store.startMission();
    const res = await usePlatformStore.getState().completeMission();
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.COMPLETED);
    assert.strictEqual(usePlatformStore.getState().robot.activeMissionId, null);
  });

  await t.test('cancelMission works', async () => {
    const store = usePlatformStore.getState();
    await store.createMission({ shipName: 'Test Ship' });
    await store.startMission();
    const res = await usePlatformStore.getState().cancelMission();
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.ABORTED);
  });

  await t.test('interruptMission updates status', async () => {
    const store = usePlatformStore.getState();
    await store.createMission({ shipName: 'Test Ship' });
    await store.startMission();
    const res = await usePlatformStore.getState().interruptMission();
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.status, MissionStatus.PAUSED);
  });

  await t.test('progress boundaries', async () => {
    const store = usePlatformStore.getState();
    await store.createMission({ shipName: 'Test Ship' });
    await store.startMission();
    
    let res = usePlatformStore.getState().setMissionProgress(50);
    assert.strictEqual(res.success, true);
    assert.strictEqual(usePlatformStore.getState().mission.progressPercentage, 50);
    
    res = usePlatformStore.getState().setMissionProgress(-10);
    assert.strictEqual(res.success, false);
    
    res = usePlatformStore.getState().setMissionProgress(110);
    assert.strictEqual(res.success, false);
  });

  t.after(() => {
    global.fetch = originalFetch;
    delete (global as any).localStorage;
  });
});
