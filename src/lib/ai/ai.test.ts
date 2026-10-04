import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateDeterministicStrategy } from '../cutting/strategy';
import { processRoboAssistQuery, simulateVisionCandidate } from './engine';

describe('AI Operational Layer', () => {
  it('A. Generates deterministic AI cut strategy without hallucinated confidence', () => {
    const cut: any = {
      id: 'CUT-TEST',
      sequenceNumber: 1,
      estimate: { energyRequirementKj: 2000, cutLengthMeters: 1.5 },
      validation: { structuralStatus: 'SAFE', supportStatus: 'SAFE', overallRisk: 'LOW' }
    };
    const strategy = generateDeterministicStrategy(cut);
    assert.strictEqual(strategy.cutId, 'CUT-TEST');
    assert.strictEqual(strategy.confidence, 'UNKNOWN'); // Does not fabricate confidence
    assert.strictEqual(strategy.isOptimal, false); // Due to high energy
    assert.ok(strategy.gasOptimization.includes('High energy demand'));
  });

  it('B. Validates structural conflicts deterministically', () => {
    const cut: any = {
      id: 'CUT-CONFLICT',
      sequenceNumber: 2,
      validation: { structuralStatus: 'CONFLICT', supportStatus: 'SAFE', overallRisk: 'HIGH' }
    };
    const strategy = generateDeterministicStrategy(cut);
    assert.strictEqual(strategy.isOptimal, false);
    assert.ok(strategy.structuralWarning?.includes('Structural rib conflict'));
  });

  it('C. Simulates vision candidate safely', () => {
    const candidate = simulateVisionCandidate();
    assert.ok(candidate.id.startsWith('VIS-'));
    assert.strictEqual(candidate.isSimulated, true);
    assert.ok(candidate.proposedCut);
  });
});
