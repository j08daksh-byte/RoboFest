import { PrismaClient } from '@prisma/client';
import { evaluateGasRules, evaluateRobotRules, evaluateSystemRules, getHighestPriorityLevel } from './safetyRules';
import { SensorState, EnvironmentState, SafetyLevel } from '../domain';

const prisma = new PrismaClient();

export type OperationType = 'MISSION_START' | 'CUT_START' | 'DANGEROUS_COMMAND' | 'CLEAR_ESTOP' | 'ESTOP';

export interface SafetyEvaluation {
  allowed: boolean;
  reasons: string[];
  hazards: any[];
  severity: SafetyLevel;
}

export async function evaluateServerSafety(
  operation: OperationType, 
  userId?: string, 
  userRole?: string
): Promise<SafetyEvaluation> {
  const evaluation: SafetyEvaluation = {
    allowed: true,
    reasons: [],
    hazards: [],
    severity: SafetyLevel.NORMAL
  };

  const state = await prisma.runtimeState.findUnique({ where: { id: 'singleton' } });
  if (!state) {
    evaluation.allowed = false;
    evaluation.reasons.push('Runtime state unavailable.');
    return evaluation;
  }

  // 1. CLEAR_ESTOP logic
  if (operation === 'CLEAR_ESTOP') {
    if (!state.emergencyActive) {
      evaluation.allowed = false;
      evaluation.reasons.push('E-Stop is not active.');
      return evaluation;
    }
    if (userRole !== 'ENGINEER' && userRole !== 'SUPERVISOR' && userRole !== 'ADMIN') {
      evaluation.allowed = false;
      evaluation.reasons.push('Insufficient permissions to clear E-Stop.');
      return evaluation;
    }
    return evaluation; // allowed
  }

  // 2. ESTOP is always allowed (fail-safe)
  if (operation === 'ESTOP') {
    return evaluation;
  }

  // 3. E-STOP Blocking (For all other operational commands)
  if (state.emergencyActive) {
    evaluation.allowed = false;
    evaluation.reasons.push('Emergency Stop is currently active. Operation blocked.');
    evaluation.severity = SafetyLevel.EVACUATION;
    return evaluation;
  }

  // 4. Telemetry/Hardware hazard checks (for MISSION_START, CUT_START, DANGEROUS_COMMAND)
  // Fetch latest simulated/live telemetry
  const latestTelemetry = await prisma.telemetryRecord.findFirst({
    orderBy: { timestamp: 'desc' }
  });

  if (latestTelemetry) {
    const env: EnvironmentState = {
      temperatureC: latestTelemetry.envTemperatureC,
      humidityPercentage: latestTelemetry.envHumidity,
      windSpeedKmh: latestTelemetry.envWindSpeed,
      rain: latestTelemetry.envRain,
      visibilityStatus: latestTelemetry.envVisibility as any,
      atmosphericPressureHpa: latestTelemetry.envAtmosphericPressure,
      stormWorkabilityState: 'WORKABLE', // Simplified mapping
      o2Percentage: latestTelemetry.envO2Percentage,
      coPpm: latestTelemetry.envCoPpm,
      co2Ppm: latestTelemetry.envCo2Ppm,
      combustibleGasLel: latestTelemetry.envCombustibleGasLel
    };

    const sensor: SensorState = {
      imu: { 
        acceleration: { x: latestTelemetry.imuAccelX, y: latestTelemetry.imuAccelY, z: latestTelemetry.imuAccelZ },
        gyro: { x: latestTelemetry.imuGyroX, y: latestTelemetry.imuGyroY, z: latestTelemetry.imuGyroZ },
        tiltAngle: latestTelemetry.imuTiltAngle
      },
      motors: {
        tempLeft: latestTelemetry.motorTempLeft,
        tempRight: latestTelemetry.motorTempRight,
        currentLeft: latestTelemetry.motorCurrentLeft,
        currentRight: latestTelemetry.motorCurrentRight
      },
      hardware: {
        electromagnetCurrent: latestTelemetry.electromagnetCurrent,
        armExtensionX: latestTelemetry.armExtensionX,
        armExtensionY: latestTelemetry.armExtensionY,
        vibrationLevel: latestTelemetry.vibrationLevel
      },
      gas: {
        torchStatus: latestTelemetry.torchStatus as 'IGNITED' | 'OFF' | 'FAULT',
        oxyPressurePsi: latestTelemetry.oxyPressurePsi,
        oxyFlowRate: latestTelemetry.oxyFlowRate,
        acePressurePsi: latestTelemetry.acePressurePsi,
        aceFlowRate: latestTelemetry.aceFlowRate
      },
      metadata: { lastUpdated: latestTelemetry.timestamp.toISOString(), isStale: false, isSimulated: latestTelemetry.mode === 'SIMULATED' }
    };

    const gasEvals = evaluateGasRules(env);
    const botEvals = evaluateRobotRules(sensor);
    const sysEvals = evaluateSystemRules(sensor, env, state.emergencyActive);

    const allEvals = [...gasEvals, ...botEvals, ...sysEvals];
    
    // Component Health relationship
    const faultyComponents = await prisma.componentHealth.findMany({
      where: { status: { in: ['FAULT', 'CRITICAL'] } }
    });
    if (faultyComponents.length > 0) {
      allEvals.push({
        isTriggered: true,
        level: SafetyLevel.CRITICAL,
        hazardId: 'SYS-COMP-FAULT',
        description: `Critical Component Faults: ${faultyComponents.map(c => c.name).join(', ')}`,
        severity: 'HIGH'
      });
    }

    evaluation.hazards = allEvals;
    evaluation.severity = getHighestPriorityLevel(allEvals.map(e => e.level));

    const blockLevels = [SafetyLevel.EVACUATION, SafetyLevel.ROBOT_STOP, SafetyLevel.CRITICAL];
    if (operation === 'CUT_START') blockLevels.push(SafetyLevel.TORCH_OFF);

    const blockingHazards = allEvals.filter(e => blockLevels.includes(e.level));
    
    if (blockingHazards.length > 0) {
      evaluation.allowed = false;
      evaluation.reasons.push('Safety hazards present: ' + blockingHazards.map(h => h.description).join(', '));
    }
  }

  // 5. Operation specific checks
  if (operation === 'CUT_START') {
    if (state.activeMissionId == null) {
      evaluation.allowed = false;
      evaluation.reasons.push('No active mission is RUNNING.');
    } else {
      const activeMission = await prisma.mission.findUnique({ where: { id: state.activeMissionId } });
      if (!activeMission || activeMission.status !== 'RUNNING') {
         evaluation.allowed = false;
         evaluation.reasons.push('Mission is not in RUNNING state.');
      }
    }
  }

  return evaluation;
}
