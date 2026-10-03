import assert from 'node:assert';
import { describe, it } from 'node:test';
import { validateMissionPayload, validateEventPayload, validateCutPayload } from './persistence';

describe('Persistence Boundary Validation', () => {
  it('TEST 1: rejects mission without required fields', () => {
    const payload = { shipName: 'Test' }; // missing objective, hullSection
    const res = validateMissionPayload(payload);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Missing required fields/);
  });

  it('TEST 2: accepts valid mission and drops arbitrary mass-assignment fields', () => {
    const payload = {
      shipName: 'Ship-Alpha',
      objective: 'Scrap',
      hullSection: 'Port-Side',
      status: 'PLANNED',
      injectedAdminRole: true, // Should be dropped
      fakeId: '123' // Should be dropped
    };
    
    const res = validateMissionPayload(payload);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual((res.data as Record<string, unknown>).shipName, 'Ship-Alpha');
    assert.strictEqual((res.data as Record<string, unknown>).injectedAdminRole, undefined);
    assert.strictEqual((res.data as Record<string, unknown>).fakeId, undefined);
  });

  it('TEST 3: accepts valid event and automatically adds timestamp if missing', () => {
    const payload = {
      category: 'SAFETY',
      message: 'Torch warning',
      severity: 'WARNING'
    };
    const res = validateEventPayload(payload);
    assert.strictEqual(res.isValid, true);
    assert.ok(res.data?.timestamp);
  });

  it('TEST 4: validates cut payload and requires geometryJson', () => {
    const payload = { otherStuff: true };
    const res = validateCutPayload(payload, 'mission-1');
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Missing required field/);
    
    const valid = validateCutPayload({ geometryJson: '{}' }, 'mission-1');
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.data?.missionId, 'mission-1');
  });

  it('TEST 5: payload must be an object', () => {
    const res = validateMissionPayload('just a string');
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Payload must be an object/);
  });
});
