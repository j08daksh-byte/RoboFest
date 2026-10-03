import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateCommand } from './commands';

describe('Command Gateway Validation', () => {
  it('TEST 1: valid LOCOMOTION command -> accepted structurally', () => {
    const cmd = {
      type: 'UPDATE_LOCOMOTION',
      id: 'cmd-1',
      timestamp: new Date().toISOString(),
      source: 'TEST',
      payload: { x: 1.0, y: 2.0, trackOffsetDelta: 0.1 }
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, true);
  });

  it('TEST 2: valid ARM_POSITION command -> accepted structurally', () => {
    const cmd = {
      type: 'SET_ARM_POSITION',
      id: 'cmd-2',
      timestamp: new Date().toISOString(),
      source: 'TEST',
      payload: { xExtension: 0.5, yPosition: 0.1 }
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, true);
  });

  it('TEST 3: valid TORCH command -> accepted structurally', () => {
    const cmd = {
      type: 'SET_TORCH',
      id: 'cmd-3',
      timestamp: new Date().toISOString(),
      source: 'TEST',
      payload: { enabled: true }
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, true);
  });

  it('TEST 4: valid ELECTROMAGNET command -> accepted structurally', () => {
    const cmd = {
      type: 'SET_ELECTROMAGNET',
      id: 'cmd-4',
      timestamp: new Date().toISOString(),
      source: 'TEST',
      payload: { enabled: false }
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, true);
  });

  it('TEST 5: valid EMERGENCY_STOP command -> accepted structurally', () => {
    const cmd = {
      type: 'TRIGGER_EMERGENCY_STOP',
      id: 'cmd-5',
      timestamp: new Date().toISOString(),
      source: 'TEST'
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, true);
  });

  it('TEST 6: unknown command -> rejected', () => {
    const cmd = {
      type: 'FLY_TO_MOON',
      id: 'cmd-6',
      timestamp: new Date().toISOString(),
      source: 'TEST'
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Unknown command type/);
  });

  it('TEST 7: missing required parameter -> rejected', () => {
    const cmd = {
      type: 'SET_TORCH',
      // missing id
      timestamp: new Date().toISOString(),
      source: 'TEST',
      payload: { enabled: true }
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Missing or invalid command id/);
  });

  it('TEST 8: malformed parameter type -> rejected', () => {
    const cmd = {
      type: 'UPDATE_LOCOMOTION',
      id: 'cmd-8',
      timestamp: new Date().toISOString(),
      source: 'TEST',
      payload: { x: "1.0", y: 2.0, trackOffsetDelta: 0.1 } // x is string
    };
    const res = validateCommand(cmd);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Invalid payload for UPDATE_LOCOMOTION/);
  });
});
