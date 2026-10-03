import { CutDefinition } from './domain';

export interface StrategyRecommendation {
  cutId: string;
  recommendedSequence: number;
  gasOptimization: string;
  structuralWarning: string | null;
  confidence: 'UNKNOWN'; 
  isOptimal: boolean;
}

export function generateDeterministicStrategy(cut: CutDefinition): StrategyRecommendation {
  let gasOptimization = 'Standard gas profile recommended.';
  let structuralWarning = null;
  let isOptimal = true;

  if (cut.estimate) {
    if (cut.estimate.energyRequirementKj > 1000) {
      gasOptimization = 'High energy demand: Pre-heating of start point advised.';
      isOptimal = false;
    } else if (cut.estimate.cutLengthMeters < 0.3) {
      gasOptimization = 'Short path: Decrease oxygen pressure by 15% to prevent blowout.';
    }
  }

  if (cut.validation) {
    if (cut.validation.structuralStatus === 'CONFLICT') {
      structuralWarning = 'Structural rib conflict detected. Do not sever load-bearing elements without support.';
      isOptimal = false;
    } else if (cut.validation.supportStatus === 'CONFLICT') {
      structuralWarning = 'Support infrastructure in path. Immediate rerouting mandatory.';
      isOptimal = false;
    }
    
    if (cut.validation.overallRisk === 'WARNING') {
      isOptimal = false;
    }
  }

  return {
    cutId: cut.id,
    recommendedSequence: cut.sequenceNumber,
    gasOptimization,
    structuralWarning,
    confidence: 'UNKNOWN', // No fabricated AI confidence
    isOptimal
  };
}
