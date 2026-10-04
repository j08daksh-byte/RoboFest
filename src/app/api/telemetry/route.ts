import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';
import { evaluateSystemHealth } from '@/lib/health/healthEngine';
import { SystemMode } from '@/lib/domain';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  return withAuth(request, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.ADMIN, UserRole.SUPERVISOR], async (req, user) => {
    try {
      const data = await req.json();

      // Basic validation
      if (!data.source || !data.mode) {
        return NextResponse.json({ error: 'Missing source or mode' }, { status: 400 });
      }

      // Live mode restriction
      if (data.mode === SystemMode.LIVE) {
        // For now, only SYSTEM or specific roles can push LIVE telemetry.
        // As a safeguard, browser users shouldn't push LIVE. 
        // We'll enforce this by checking the user's role or token source in the future,
        // but for now, any user with ENGINEER/ADMIN could theoretically simulate hardware.
        // To be safe per requirements: "Never allow browser users to label arbitrary fake values as LIVE."
        // We will reject LIVE for now until ESP32 MQTT adapter is built.
        return NextResponse.json({ error: 'LIVE telemetry ingestion is reserved for hardware adapters.' }, { status: 403 });
      }

      const record = await prisma.telemetryRecord.create({
        data: {
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          robotId: data.robot?.id || 'ROBO-1',
          source: data.source,
          mode: data.mode,

          powerVoltage: data.robot?.powerVoltage ?? 0,
          powerCurrent: data.robot?.powerCurrent ?? 0,

          imuAccelX: data.imu?.acceleration?.x ?? 0,
          imuAccelY: data.imu?.acceleration?.y ?? 0,
          imuAccelZ: data.imu?.acceleration?.z ?? 0,
          imuGyroX: data.imu?.gyro?.x ?? 0,
          imuGyroY: data.imu?.gyro?.y ?? 0,
          imuGyroZ: data.imu?.gyro?.z ?? 0,
          imuTiltAngle: data.imu?.tiltAngle ?? 0,

          motorCurrentLeft: data.motors?.currentLeft ?? 0,
          motorCurrentRight: data.motors?.currentRight ?? 0,
          motorTempLeft: data.motors?.tempLeft ?? 0,
          motorTempRight: data.motors?.tempRight ?? 0,

          electromagnetCurrent: data.hardware?.electromagnetCurrent ?? 0,
          electromagnetEnabled: data.hardware?.electromagnetEnabled ?? false,
          armExtensionY: data.hardware?.armExtensionY ?? 0,
          armExtensionX: data.hardware?.armExtensionX ?? 0,
          vibrationLevel: data.hardware?.vibrationLevel ?? 0,
          torchStatus: data.gas?.torchStatus || 'OFF',

          oxyPressurePsi: data.gas?.oxyPressurePsi ?? 0,
          oxyFlowRate: data.gas?.oxyFlowRate ?? 0,
          acePressurePsi: data.gas?.acePressurePsi ?? 0,
          aceFlowRate: data.gas?.aceFlowRate ?? 0,

          envTemperatureC: data.environment?.temperatureC ?? 0,
          envHumidity: data.environment?.humidityPercentage ?? 0,
          envAtmosphericPressure: data.environment?.atmosphericPressureHpa ?? 0,
          envWindSpeed: data.environment?.windSpeedKmh ?? 0,
          envRain: data.environment?.rain ?? false,
          envVisibility: data.environment?.visibilityStatus ?? 'CLEAR',
          envO2Percentage: data.environment?.o2Percentage ?? 0,
          envCoPpm: data.environment?.coPpm ?? 0,
          envCo2Ppm: data.environment?.co2Ppm ?? 0,
          envCombustibleGasLel: data.environment?.combustibleGasLel ?? 0,

          positionX: data.position?.x ?? 0,
          positionY: data.position?.y ?? 0,
          positionZ: data.position?.z ?? 0,
          
          overallHealth: data.robot?.overallHealth || 'GOOD',
        }
      });

      // Update component health models
      await evaluateSystemHealth(record);

      // Data Retention: Bounded Strategy
      // Keep only last 1000 records for SIMULATED, to prevent DB bloat.
      const maxRecords = 1000;
      const count = await prisma.telemetryRecord.count({ where: { mode: data.mode } });
      if (count > maxRecords) {
        const oldestRecords = await prisma.telemetryRecord.findMany({
          where: { mode: data.mode },
          orderBy: { timestamp: 'asc' },
          take: count - maxRecords,
          select: { id: true }
        });
        const idsToDelete = oldestRecords.map(r => r.id);
        if (idsToDelete.length > 0) {
          await prisma.telemetryRecord.deleteMany({
            where: { id: { in: idsToDelete } }
          });
        }
      }

      // Event Generation for major anomalies
      if (data.gas?.torchStatus === 'ERROR' || data.robot?.overallHealth === 'CRITICAL' || data.robot?.overallHealth === 'FAULT') {
        await prisma.eventLog.create({
          data: {
            category: 'TELEMETRY',
            type: 'ANOMALY',
            severity: 'CRITICAL',
            message: `Telemetry anomaly detected: Health=${data.robot?.overallHealth}, Torch=${data.gas?.torchStatus}`,
            robotId: data.robotId || 'ROBO-1',
            userId: user.id as string
          }
        });
      }

      return NextResponse.json({ success: true, id: record.id }, { status: 201 });
    } catch (e: any) {
      console.error(e);
      return NextResponse.json({ error: 'Invalid telemetry payload' }, { status: 400 });
    }
  });
}

export async function GET(request: Request) {
  return withAuth(request, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.ADMIN, UserRole.SUPERVISOR], async (req) => {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit') || '50';
    const limit = Math.min(parseInt(limitParam, 10) || 50, 500); // Bounded to max 500
    const mode = url.searchParams.get('mode') || SystemMode.SIMULATED;

    const records = await prisma.telemetryRecord.findMany({
      where: { mode },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return NextResponse.json({ data: records }, { status: 200 });
  });
}
