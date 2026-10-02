import { SensorState, EnvironmentState, SafetyState, SafetyLevel } from '../domain';
import { 
  evaluateGasRules, 
  evaluateRobotRules, 
  evaluateSystemRules, 
  getHighestPriorityLevel, 
  RuleEvaluation 
} from './safetyRules';

export interface SafetyEvaluationResult {
  state: SafetyState;
  newEvents: RuleEvaluation[];
}

export function evaluateSafetyState(
  sensor: SensorState,
  env: EnvironmentState,
  forceEStop: boolean
): SafetyEvaluationResult {
  const gasEvals = evaluateGasRules(env);
  const robotEvals = evaluateRobotRules(sensor);
  const sysEvals = evaluateSystemRules(sensor, env, forceEStop);

  const allEvals = [...gasEvals, ...robotEvals, ...sysEvals];
  
  const currentLevel = getHighestPriorityLevel(allEvals.map(e => e.level));
  
  const activeHazards = allEvals.map(e => ({
    id: e.hazardId,
    description: e.description,
    severity: e.severity,
    timestamp: new Date().toISOString()
  }));

  const torchPermission = !(
    currentLevel === SafetyLevel.TORCH_OFF ||
    currentLevel === SafetyLevel.ROBOT_STOP ||
    currentLevel === SafetyLevel.ALARM ||
    currentLevel === SafetyLevel.EVACUATION ||
    currentLevel === SafetyLevel.CRITICAL
  );

  const movementPermission = !(
    currentLevel === SafetyLevel.ROBOT_STOP ||
    currentLevel === SafetyLevel.ALARM ||
    currentLevel === SafetyLevel.EVACUATION
  );

  const emergencyStateActive = (
    currentLevel === SafetyLevel.ALARM || 
    currentLevel === SafetyLevel.EVACUATION || 
    forceEStop
  );

  const acknowledgementRequired = currentLevel !== SafetyLevel.NORMAL;

  const state: SafetyState = {
    level: currentLevel,
    activeHazards,
    torchPermission,
    movementPermission,
    emergencyStateActive,
    acknowledgementRequired
  };

  return {
    state,
    newEvents: allEvals
  };
}
