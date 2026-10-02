import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { usePlannerStore, DEMO_CUTS, DEMO_MATERIAL } from './index';
import { usePlatformStore } from '../platformStore';
import { SafetyLevel } from '../domain';

describe('Phase 4E: Cutting Planner Foundation', () => {
  beforeEach(() => {
    usePlannerStore.getState().clearPlanner();
    usePlatformStore.setState({
      safety: { level: SafetyLevel.NORMAL, movementPermission: true, torchPermission: true, emergencyStateActive: false, activeHazards: [], acknowledgementRequired: false }
    });
  });

  it('straight geometry, rectangle geometry, circle geometry, cut length estimation, panel mass calculation', () => {
    const store = usePlannerStore.getState();
    const idS = store.createCut({ type: 'STRAIGHT', start: {x:0, y:0}, end: {x:3, y:4} }, DEMO_MATERIAL);
    const cutS = usePlannerStore.getState().plannedCuts.find(c => c.id === idS)!;
    assert.strictEqual(cutS.estimate!.cutLengthMeters, 5); // 3-4-5 triangle

    const idR = store.createCut({ type: 'RECTANGLE', origin: {x:0, y:0}, width: 2, height: 3 }, DEMO_MATERIAL);
    const cutR = usePlannerStore.getState().plannedCuts.find(c => c.id === idR)!;
    assert.strictEqual(cutR.estimate!.cutLengthMeters, 10);
    // Area = 6. mass = 6 * 0.012 * 7850 = 565.2
    assert.strictEqual(cutR.estimate!.panelMassKg, 565.2);

    const idC = store.createCut({ type: 'CIRCLE', center: {x:0, y:0}, radius: 1 }, DEMO_MATERIAL);
    const cutC = usePlannerStore.getState().plannedCuts.find(c => c.id === idC)!;
    assert.ok(Math.abs(cutC.estimate!.cutLengthMeters - 2 * Math.PI) < 0.01);
  });

  it('invalid dimensions, polygon validation, self-intersection, reach blocked, structural conflict, support conflict', () => {
    const store = usePlannerStore.getState();
    
    // Invalid dimensions
    const id1 = store.createCut(DEMO_CUTS.find(d => d.id === 'DEMO-INVALID')!.geometry, DEMO_MATERIAL);
    store.validateCut(id1);
    let cut = usePlannerStore.getState().plannedCuts.find(c => c.id === id1)!;
    assert.strictEqual(cut.validation!.isValidGeometry, false);
    assert.strictEqual(cut.validation!.overallRisk, 'BLOCKED');

    // Polygon validation
    const id2 = store.createCut({ type: 'CUSTOM_POLYGON', vertices: [{x:0, y:0}, {x:1, y:1}] }, DEMO_MATERIAL);
    store.validateCut(id2);
    cut = usePlannerStore.getState().plannedCuts.find(c => c.id === id2)!;
    assert.strictEqual(cut.validation!.isValidGeometry, false);

    // Reach blocked
    const id3 = store.createCut(DEMO_CUTS.find(d => d.id === 'DEMO-REACH')!.geometry, DEMO_MATERIAL);
    store.validateCut(id3);
    cut = usePlannerStore.getState().plannedCuts.find(c => c.id === id3)!;
    assert.strictEqual(cut.validation!.reachStatus, 'OUT_OF_REACH');
    assert.strictEqual(cut.validation!.overallRisk, 'BLOCKED');

    // Structural conflict
    const id4 = store.createCut(DEMO_CUTS.find(d => d.id === 'DEMO-STRUCT')!.geometry, DEMO_MATERIAL);
    store.validateCut(id4);
    cut = usePlannerStore.getState().plannedCuts.find(c => c.id === id4)!;
    assert.strictEqual(cut.validation!.structuralStatus, 'CONFLICT');
    assert.strictEqual(cut.validation!.overallRisk, 'BLOCKED');

    // Support conflict
    const id5 = store.createCut(DEMO_CUTS.find(d => d.id === 'DEMO-SUPPORT')!.geometry, DEMO_MATERIAL);
    store.validateCut(id5);
    cut = usePlannerStore.getState().plannedCuts.find(c => c.id === id5)!;
    assert.strictEqual(cut.validation!.supportStatus, 'CONFLICT');
    assert.strictEqual(cut.validation!.overallRisk, 'BLOCKED');
  });

  it('safety blocked, blocked cut cannot approve, valid cut can approve', () => {
    const store = usePlannerStore.getState();
    const id = store.createCut(DEMO_CUTS[0].geometry, DEMO_MATERIAL);
    
    // Valid approval
    store.validateCut(id);
    assert.strictEqual(usePlannerStore.getState().approveCut(id), true);
    
    // Create new cut and block safety
    const id2 = store.createCut(DEMO_CUTS[0].geometry, DEMO_MATERIAL);
    usePlatformStore.setState({ safety: { level: SafetyLevel.CRITICAL, movementPermission: false, torchPermission: false, emergencyStateActive: true, activeHazards: [], acknowledgementRequired: true } });
    
    store.validateCut(id2);
    const cut2 = usePlannerStore.getState().plannedCuts.find(c => c.id === id2)!;
    assert.strictEqual(cut2.validation!.safetyStatus, 'BLOCKED_BY_SAFETY');
    assert.strictEqual(cut2.validation!.overallRisk, 'BLOCKED');
    
    // Cannot approve blocked cut
    assert.strictEqual(usePlannerStore.getState().approveCut(id2), false);
    assert.notStrictEqual(usePlannerStore.getState().plannedCuts.find(c => c.id === id2)!.approvalState, 'APPROVED');
  });

  it('mission association', () => {
    const store = usePlannerStore.getState();
    const id = store.createCut(DEMO_CUTS[0].geometry, DEMO_MATERIAL, 'TEST-MISSION-123');
    const cut = usePlannerStore.getState().plannedCuts.find(c => c.id === id)!;
    assert.strictEqual(cut.missionId, 'TEST-MISSION-123');
  });
});
