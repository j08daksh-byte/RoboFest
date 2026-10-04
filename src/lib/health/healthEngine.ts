import { PrismaClient, TelemetryRecord } from '@prisma/client';
import { DEMO_THRESHOLDS } from '@/lib/safety/safetyRules';

const prisma = new PrismaClient();

export const COMPONENTS = [
  { id: 'SYS-POWER', name: 'Power System' },
  { id: 'MOT-DRIVE', name: 'Drive Motors' },
  { id: 'ACT-TORCH', name: 'Torch System' },
  { id: 'SEN-IMU', name: 'Sensors / IMU' },
  { id: 'ACT-MAG', name: 'Electromagnet Adhesion' },
  { id: 'ACT-ARM', name: 'Cutting Arm' },
  { id: 'SYS-TRACK', name: 'Tracks / Locomotion' }
];

export async function initializeComponentHealth() {
  for (const comp of COMPONENTS) {
    await prisma.componentHealth.upsert({
      where: { componentId: comp.id },
      update: {},
      create: {
        componentId: comp.id,
        name: comp.name,
        status: 'UNKNOWN'
      }
    });
  }

  await prisma.lifetimeStatistic.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' }
  });
}

export async function evaluateSystemHealth(telemetry: TelemetryRecord | null) {
  // If no telemetry, everything is UNKNOWN
  if (!telemetry) {
    await prisma.componentHealth.updateMany({
      data: { status: 'UNKNOWN', faultState: 'No Telemetry' }
    });
    return;
  }

  // 1. Power System
  let powerStatus = 'HEALTHY';
  let powerFault = null;
  if (telemetry.powerVoltage < 10) {
    powerStatus = 'CRITICAL';
    powerFault = 'Power Disconnected or Low Voltage';
  } else if (telemetry.powerVoltage < 210) {
    powerStatus = 'WARNING';
    powerFault = 'Low Voltage';
  }
  
  await updateComponent('SYS-POWER', powerStatus, powerFault, telemetry);

  // 2. Drive Motors
  let motorStatus = 'HEALTHY';
  let motorFault = null;
  const maxTemp = Math.max(telemetry.motorTempLeft, telemetry.motorTempRight);
  const maxCurrent = Math.max(telemetry.motorCurrentLeft, telemetry.motorCurrentRight);
  
  if (maxTemp >= DEMO_THRESHOLDS.MOTOR_TEMP_CRITICAL || maxCurrent >= DEMO_THRESHOLDS.MOTOR_CURRENT_CRITICAL) {
    motorStatus = 'FAULT';
    motorFault = 'Motor Overheating or Overcurrent';
  } else if (maxTemp >= DEMO_THRESHOLDS.MOTOR_TEMP_WARNING) {
    motorStatus = 'WARNING';
    motorFault = 'Motor Temperature High';
  }
  await updateComponent('MOT-DRIVE', motorStatus, motorFault, telemetry);

  // 3. Torch System
  let torchStatus = 'HEALTHY';
  let torchFault = null;
  if (telemetry.torchStatus === 'FAULT') {
    torchStatus = 'FAULT';
    torchFault = 'Torch Ignition/Hardware Fault';
  } else if (telemetry.oxyPressurePsi < 100) {
    torchStatus = 'WARNING';
    torchFault = 'Low Oxygen Pressure';
  }
  await updateComponent('ACT-TORCH', torchStatus, torchFault, telemetry);

  // 4. Sensors / IMU
  let sensorStatus = 'HEALTHY';
  let sensorFault = null;
  // Using tilt as a proxy for IMU reading validity or stability
  if (telemetry.imuTiltAngle >= DEMO_THRESHOLDS.TILT_CRITICAL) {
    sensorStatus = 'WARNING';
    sensorFault = 'Extreme Tilt Detected';
  }
  await updateComponent('SEN-IMU', sensorStatus, sensorFault, telemetry);

  // 5. Electromagnet Adhesion
  let magStatus = 'HEALTHY';
  let magFault = null;
  if (telemetry.electromagnetEnabled && telemetry.electromagnetCurrent < 1.0) {
    magStatus = 'FAULT';
    magFault = 'Magnet Enabled but Low Current (No Adhesion)';
  }
  await updateComponent('ACT-MAG', magStatus, magFault, telemetry);

  // 6. Cutting Arm (Vibration)
  let armStatus = 'HEALTHY';
  let armFault = null;
  if (telemetry.vibrationLevel >= DEMO_THRESHOLDS.VIBRATION_CRITICAL) {
    armStatus = 'FAULT';
    armFault = 'Critical Arm Vibration';
  } else if (telemetry.vibrationLevel >= DEMO_THRESHOLDS.VIBRATION_WARNING) {
    armStatus = 'WARNING';
    armFault = 'High Arm Vibration';
  }
  await updateComponent('ACT-ARM', armStatus, armFault, telemetry);

  // 7. Tracks / Locomotion
  let trackStatus = 'HEALTHY';
  let trackFault = null;
  // Proxy: high current and high vibration might indicate track slipping/jam
  if (maxCurrent >= DEMO_THRESHOLDS.MOTOR_CURRENT_CRITICAL * 0.9 && telemetry.vibrationLevel >= DEMO_THRESHOLDS.VIBRATION_WARNING) {
    trackStatus = 'WARNING';
    trackFault = 'Track Jam Risk';
  }
  await updateComponent('SYS-TRACK', trackStatus, trackFault, telemetry);

  // Update overall health
  const allHealths = [powerStatus, motorStatus, torchStatus, sensorStatus, magStatus, armStatus, trackStatus];
  let overall = 'GOOD';
  if (allHealths.includes('FAULT') || allHealths.includes('CRITICAL')) {
    overall = 'CRITICAL';
  } else if (allHealths.includes('WARNING') || allHealths.includes('DEGRADED')) {
    overall = 'WARNING';
  }

  await prisma.telemetryRecord.update({
    where: { id: telemetry.id },
    data: { overallHealth: overall }
  });
}

async function updateComponent(id: string, status: string, faultState: string | null, telemetry: TelemetryRecord) {
  // Simple deterministic health update
  await prisma.componentHealth.upsert({
    where: { componentId: id },
    update: {
      status,
      faultState,
      lastObservedAt: new Date()
    },
    create: {
      componentId: id,
      name: COMPONENTS.find(c => c.id === id)?.name || id,
      status,
      faultState,
      lastObservedAt: new Date()
    }
  });

  // Event logging for faults
  if (status === 'FAULT' || status === 'CRITICAL') {
    // Only log if it wasn't already in fault (to avoid spam)
    // In a real system, we'd check previous state. For demo, we might over-log, but we'll try to rely on the safety events for persistence.
  }
}

export async function recordLifetimeEvent(event: 'MISSION_COMPLETED' | 'MISSION_ABORTED' | 'CUT_COMPLETED' | 'SAFETY_EVENT' | 'MAINTENANCE_EVENT', incrementRuntime: number = 0, tx: any = prisma) {
  const data: any = {
    totalRuntimeSeconds: { increment: incrementRuntime }
  };
  
  if (event === 'MISSION_COMPLETED') {
    data.totalMissions = { increment: 1 };
    data.completedMissions = { increment: 1 };
  } else if (event === 'MISSION_ABORTED') {
    data.totalMissions = { increment: 1 };
    data.abortedMissions = { increment: 1 };
  } else if (event === 'CUT_COMPLETED') {
    data.totalCuts = { increment: 1 };
    data.completedCuts = { increment: 1 };
  } else if (event === 'SAFETY_EVENT') {
    data.safetyEvents = { increment: 1 };
  } else if (event === 'MAINTENANCE_EVENT') {
    data.maintenanceEvents = { increment: 1 };
  }

  await tx.lifetimeStatistic.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { 
      id: 'singleton', 
      totalRuntimeSeconds: incrementRuntime,
      totalMissions: event === 'MISSION_COMPLETED' || event === 'MISSION_ABORTED' ? 1 : 0,
      completedMissions: event === 'MISSION_COMPLETED' ? 1 : 0,
      abortedMissions: event === 'MISSION_ABORTED' ? 1 : 0,
      totalCuts: event === 'CUT_COMPLETED' ? 1 : 0,
      completedCuts: event === 'CUT_COMPLETED' ? 1 : 0,
      safetyEvents: event === 'SAFETY_EVENT' ? 1 : 0,
      maintenanceEvents: event === 'MAINTENANCE_EVENT' ? 1 : 0
    }
  });
}
