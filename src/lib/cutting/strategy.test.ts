import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateDeterministicStrategy } from './strategy';
import { CutDefinition } from './domain';

describe('Phase 8: Deterministic Strategy Engine', () => {
  it('generates basic optimal recommendation', () => {
    const cut: CutDefinition = {
      id: 'CUT-1',
      sequenceNumber: 1,
      geometry: { type: 'STRAIGHT', start: {x: 0, y: 0}, end: {x: 1, y: 0} },
      material: { name: 'Steel', thicknessMm: 10 },
      estimate: {
        cutLengthMeters: 1,
        estimatedDurationSeconds: 200,
        gasRequirementLiters: 15,
        energyRequirementKj: 200,
        panelMassKg: null
      },
      validation: {
        isValidGeometry: true,
        geometryErrors: [],
        reachStatus: 'REACHABLE',
        structuralStatus: 'CLEAR',
        supportStatus: 'CLEAR',
        safetyStatus: 'SAFE_TO_PLAN',
        overallRisk: 'LOW'
      },
      approvalState: 'APPROVED',
      createdAt: '',
      updatedAt: ''
    };

    const strategy = generateDeterministicStrategy(cut);
    assert.strictEqual(strategy.isOptimal, true);
    assert.strictEqual(strategy.confidence, 'UNKNOWN');
    assert.strictEqual(strategy.structuralWarning, null);
  });

  it('detects structural conflict and lowers optimality', () => {
    const cut: CutDefinition = {
      id: 'CUT-2',
      sequenceNumber: 2,
      geometry: { type: 'STRAIGHT', start: {x: 0, y: 0}, end: {x: 1, y: 0} },
      material: { name: 'Steel', thicknessMm: 10 },
      estimate: null,
      validation: {
        isValidGeometry: true,
        geometryErrors: [],
        reachStatus: 'REACHABLE',
        structuralStatus: 'CONFLICT',
        supportStatus: 'CLEAR',
        safetyStatus: 'SAFE_TO_PLAN',
        overallRisk: 'BLOCKED'
      },
      approvalState: 'BLOCKED',
      createdAt: '',
      updatedAt: ''
    };

    const strategy = generateDeterministicStrategy(cut);
    assert.strictEqual(strategy.isOptimal, false);
    assert.ok(strategy.structuralWarning?.includes('Structural rib conflict'));
  });

  it('advises on high energy demand', () => {
    const cut: CutDefinition = {
      id: 'CUT-3',
      sequenceNumber: 3,
      geometry: { type: 'STRAIGHT', start: {x: 0, y: 0}, end: {x: 1, y: 0} },
      material: { name: 'Steel', thicknessMm: 100 },
      estimate: {
        cutLengthMeters: 10,
        estimatedDurationSeconds: 2000,
        gasRequirementLiters: 150,
        energyRequirementKj: 2000, // > 1000
        panelMassKg: null
      },
      validation: null,
      approvalState: 'DRAFT',
      createdAt: '',
      updatedAt: ''
    };

    const strategy = generateDeterministicStrategy(cut);
    assert.strictEqual(strategy.isOptimal, false);
    assert.ok(strategy.gasOptimization.includes('Pre-heating'));
  });
});
