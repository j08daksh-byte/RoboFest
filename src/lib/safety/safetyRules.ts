import { SensorState, EnvironmentState, SafetyState, SafetyLevel } from '../domain';

// ==========================================
// DEMO / SIMULATION THRESHOLDS
// These are NOT engineering-certified limits.
// They exist purely for deterministic simulation behavior.
// ==========================================
export const DEMO_THRESHOLDS = {
  GAS_COMBUSTIBLE_WARNING: 10,   // % LEL
  GAS_COMBUSTIBLE_CRITICAL: 20,  // % LEL
  GAS_O2_WARNING_LOW: 19.5,      // %
  GAS_O2_CRITICAL_LOW: 18.0,     // %
  GAS_O2_WARNING_HIGH: 23.0,     // %
  GAS_O2_CRITICAL_HIGH: 23.5,    // %
  GAS_CO_WARNING: 35,            // ppm
  GAS_CO_CRITICAL: 100,          // ppm
  
  MOTOR_TEMP_WARNING: 65,        // °C
  MOTOR_TEMP_CRITICAL: 80,       // °C
  
  MOTOR_CURRENT_WARNING: 15,     // A
  MOTOR_CURRENT_CRITICAL: 25,    // A
  
  TILT_WARNING: 30,              // degrees
  TILT_CRITICAL: 45,             // degrees

  VIBRATION_WARNING: 5.0,        // m/s^2
  VIBRATION_CRITICAL: 10.0,      // m/s^2
};

export type RuleEvaluation = {
  isTriggered: boolean;
  level: SafetyLevel;
  hazardId: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
};

// Priority ordering (higher index = higher priority)
export const SAFETY_LEVEL_PRIORITY = [
  SafetyLevel.NORMAL,
  SafetyLevel.WARNING,
  SafetyLevel.CRITICAL,
  SafetyLevel.TORCH_OFF,
  SafetyLevel.ROBOT_STOP,
  SafetyLevel.ALARM,
  SafetyLevel.EVACUATION
];

export function getHighestPriorityLevel(levels: SafetyLevel[]): SafetyLevel {
  if (levels.length === 0) return SafetyLevel.NORMAL;
  return levels.reduce((highest, current) => {
    return SAFETY_LEVEL_PRIORITY.indexOf(current) > SAFETY_LEVEL_PRIORITY.indexOf(highest) 
      ? current 
      : highest;
  }, SafetyLevel.NORMAL);
}

function evaluate(
  condition: boolean, 
  level: SafetyLevel, 
  hazardId: string, 
  description: string, 
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
): RuleEvaluation | null {
  return condition ? { isTriggered: true, level, hazardId, description, severity } : null;
}

export function evaluateGasRules(env: EnvironmentState): RuleEvaluation[] {
  const evals: (RuleEvaluation | null)[] = [
    // Combustible Gas
    evaluate(env.combustibleGasLel >= DEMO_THRESHOLDS.GAS_COMBUSTIBLE_CRITICAL, SafetyLevel.EVACUATION, 'GAS_COMB_CRIT', 'Critical combustible gas levels detected.', 'HIGH'),
    evaluate(env.combustibleGasLel >= DEMO_THRESHOLDS.GAS_COMBUSTIBLE_WARNING && env.combustibleGasLel < DEMO_THRESHOLDS.GAS_COMBUSTIBLE_CRITICAL, SafetyLevel.WARNING, 'GAS_COMB_WARN', 'Elevated combustible gas levels.', 'MEDIUM'),
    
    // O2 Low
    evaluate(env.o2Percentage <= DEMO_THRESHOLDS.GAS_O2_CRITICAL_LOW, SafetyLevel.EVACUATION, 'GAS_O2_LOW_CRIT', 'Critically low oxygen levels.', 'HIGH'),
    evaluate(env.o2Percentage <= DEMO_THRESHOLDS.GAS_O2_WARNING_LOW && env.o2Percentage > DEMO_THRESHOLDS.GAS_O2_CRITICAL_LOW, SafetyLevel.WARNING, 'GAS_O2_LOW_WARN', 'Low oxygen levels detected.', 'MEDIUM'),
    
    // O2 High
    evaluate(env.o2Percentage >= DEMO_THRESHOLDS.GAS_O2_CRITICAL_HIGH, SafetyLevel.TORCH_OFF, 'GAS_O2_HIGH_CRIT', 'Critically high oxygen levels (fire risk).', 'HIGH'),
    evaluate(env.o2Percentage >= DEMO_THRESHOLDS.GAS_O2_WARNING_HIGH && env.o2Percentage < DEMO_THRESHOLDS.GAS_O2_CRITICAL_HIGH, SafetyLevel.WARNING, 'GAS_O2_HIGH_WARN', 'Elevated oxygen levels.', 'MEDIUM'),

    // CO
    evaluate(env.coPpm >= DEMO_THRESHOLDS.GAS_CO_CRITICAL, SafetyLevel.EVACUATION, 'GAS_CO_CRIT', 'Critical carbon monoxide levels.', 'HIGH'),
    evaluate(env.coPpm >= DEMO_THRESHOLDS.GAS_CO_WARNING && env.coPpm < DEMO_THRESHOLDS.GAS_CO_CRITICAL, SafetyLevel.WARNING, 'GAS_CO_WARN', 'Elevated carbon monoxide.', 'MEDIUM'),
  ];
  return evals.filter((e): e is RuleEvaluation => e !== null);
}

export function evaluateRobotRules(sensor: SensorState): RuleEvaluation[] {
  const evals: (RuleEvaluation | null)[] = [
    // Motor Temp
    evaluate(sensor.motors.tempLeft >= DEMO_THRESHOLDS.MOTOR_TEMP_CRITICAL || sensor.motors.tempRight >= DEMO_THRESHOLDS.MOTOR_TEMP_CRITICAL, SafetyLevel.ROBOT_STOP, 'MOTOR_TEMP_CRIT', 'Critical motor overheating.', 'HIGH'),
    evaluate(
      (sensor.motors.tempLeft >= DEMO_THRESHOLDS.MOTOR_TEMP_WARNING && sensor.motors.tempLeft < DEMO_THRESHOLDS.MOTOR_TEMP_CRITICAL) || 
      (sensor.motors.tempRight >= DEMO_THRESHOLDS.MOTOR_TEMP_WARNING && sensor.motors.tempRight < DEMO_THRESHOLDS.MOTOR_TEMP_CRITICAL),
      SafetyLevel.WARNING, 'MOTOR_TEMP_WARN', 'Elevated motor temperature.', 'MEDIUM'
    ),
    
    // Motor Current
    evaluate(sensor.motors.currentLeft >= DEMO_THRESHOLDS.MOTOR_CURRENT_CRITICAL || sensor.motors.currentRight >= DEMO_THRESHOLDS.MOTOR_CURRENT_CRITICAL, SafetyLevel.ROBOT_STOP, 'MOTOR_CURRENT_CRIT', 'Critical motor current draw.', 'HIGH'),
    evaluate(
      (sensor.motors.currentLeft >= DEMO_THRESHOLDS.MOTOR_CURRENT_WARNING && sensor.motors.currentLeft < DEMO_THRESHOLDS.MOTOR_CURRENT_CRITICAL) || 
      (sensor.motors.currentRight >= DEMO_THRESHOLDS.MOTOR_CURRENT_WARNING && sensor.motors.currentRight < DEMO_THRESHOLDS.MOTOR_CURRENT_CRITICAL),
      SafetyLevel.WARNING, 'MOTOR_CURRENT_WARN', 'Elevated motor current draw.', 'MEDIUM'
    ),

    // Tilt
    evaluate(Math.abs(sensor.imu.tiltAngle) >= DEMO_THRESHOLDS.TILT_CRITICAL, SafetyLevel.ROBOT_STOP, 'TILT_CRIT', 'Critical tilt angle. Risk of detachment.', 'HIGH'),
    evaluate(Math.abs(sensor.imu.tiltAngle) >= DEMO_THRESHOLDS.TILT_WARNING && Math.abs(sensor.imu.tiltAngle) < DEMO_THRESHOLDS.TILT_CRITICAL, SafetyLevel.WARNING, 'TILT_WARN', 'Elevated tilt angle.', 'MEDIUM'),

    // Vibration
    evaluate(sensor.hardware.vibrationLevel >= DEMO_THRESHOLDS.VIBRATION_CRITICAL, SafetyLevel.ROBOT_STOP, 'VIB_CRIT', 'Critical vibration levels.', 'HIGH'),
    evaluate(sensor.hardware.vibrationLevel >= DEMO_THRESHOLDS.VIBRATION_WARNING && sensor.hardware.vibrationLevel < DEMO_THRESHOLDS.VIBRATION_CRITICAL, SafetyLevel.WARNING, 'VIB_WARN', 'Elevated vibration.', 'MEDIUM'),
  ];
  return evals.filter((e): e is RuleEvaluation => e !== null);
}

export function evaluateSystemRules(sensor: SensorState, env: EnvironmentState, forceEStop: boolean): RuleEvaluation[] {
  const evals: (RuleEvaluation | null)[] = [
    evaluate(forceEStop, SafetyLevel.EVACUATION, 'SYS_ESTOP', 'Emergency Stop Activated', 'HIGH'),
    evaluate(sensor.metadata.isStale, SafetyLevel.CRITICAL, 'SYS_STALE_DATA', 'Telemetry data is stale.', 'HIGH'),
    evaluate(env.stormWorkabilityState === 'NO_GO', SafetyLevel.ROBOT_STOP, 'ENV_NO_GO', 'Site conditions restrict all work.', 'HIGH')
  ];
  return evals.filter((e): e is RuleEvaluation => e !== null);
}
