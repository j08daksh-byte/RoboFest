import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  return withAuth(request, [], async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const timeRange = searchParams.get('timeRange') || 'all';
      
      let dateFilter: any = undefined;
      const now = new Date();
      if (timeRange === 'today') {
        const start = new Date(now);
        start.setHours(0,0,0,0);
        dateFilter = { gte: start };
      } else if (timeRange === '7d') {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        dateFilter = { gte: start };
      } else if (timeRange === '30d') {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        dateFilter = { gte: start };
      }

      // Missions
      const missionWhere = dateFilter ? { createdAt: dateFilter } : {};
      const missions = await prisma.mission.findMany({ where: missionWhere, select: { status: true, startedAt: true, completedAt: true } });
      const totalMissions = missions.length;
      const completedMissions = missions.filter(m => m.status === 'COMPLETED').length;
      const abortedMissions = missions.filter(m => m.status === 'ABORTED').length;
      const runningMissions = missions.filter(m => m.status === 'RUNNING').length;
      const pausedMissions = missions.filter(m => m.status === 'PAUSED').length;
      
      let totalMissionDuration = 0;
      let completedMissionWithDuration = 0;
      for (const m of missions) {
        if (m.status === 'COMPLETED' && m.startedAt && m.completedAt) {
          totalMissionDuration += (m.completedAt.getTime() - m.startedAt.getTime()) / 1000;
          completedMissionWithDuration++;
        }
      }
      const avgMissionDuration = completedMissionWithDuration > 0 ? totalMissionDuration / completedMissionWithDuration : 0;

      // Cuts
      const cutWhere = dateFilter ? { createdAt: dateFilter } : {};
      const cuts = await prisma.cutRecord.findMany({ where: cutWhere, select: { status: true, missionId: true } });
      const totalCuts = cuts.length;
      const completedCuts = cuts.filter(c => c.status === 'COMPLETED').length;
      const abortedCuts = cuts.filter(c => c.status === 'ABORTED').length;
      const failedCuts = cuts.filter(c => c.status === 'FAILED').length;

      // Events
      const eventWhere = dateFilter ? { timestamp: dateFilter } : {};
      const safetyEvents = await prisma.eventLog.count({ where: { ...eventWhere, category: 'SAFETY' } });
      const estops = await prisma.eventLog.count({ where: { ...eventWhere, type: { in: ['ESTOP_ASSERTED'] } } });
      const rejectedUnsafe = await prisma.eventLog.count({ where: { ...eventWhere, type: { in: ['REJECTED_COMMAND', 'UNSAFE_MISSION', 'UNSAFE_CUT'] } } });
      
      const maintenanceEvents = await prisma.eventLog.count({ where: { ...eventWhere, category: 'MAINTENANCE' } });
      const faultEvents = await prisma.eventLog.count({ where: { ...eventWhere, category: 'TELEMETRY', severity: 'CRITICAL' } });

      // Commands
      const commandWhere = dateFilter ? { createdAt: dateFilter } : {};
      const totalCommands = await prisma.commandRecord.count({ where: commandWhere });

      // Health state
      const components = await prisma.componentHealth.findMany({ select: { status: true, runtimeSeconds: true } });
      let totalRuntime = 0;
      if (components.length > 0) {
        totalRuntime = Math.max(...components.map(c => c.runtimeSeconds));
      }
      
      const healthDist = {
        HEALTHY: components.filter(c => c.status === 'HEALTHY').length,
        WARNING: components.filter(c => c.status === 'WARNING').length,
        FAULT: components.filter(c => c.status === 'FAULT' || c.status === 'CRITICAL').length,
        UNKNOWN: components.filter(c => c.status === 'UNKNOWN').length,
      };

      // Timestamps
      const firstEvent = await prisma.eventLog.findFirst({ orderBy: { timestamp: 'asc' }, select: { timestamp: true } });
      const lastEvent = await prisma.eventLog.findFirst({ orderBy: { timestamp: 'desc' }, select: { timestamp: true } });

      return NextResponse.json({
        data: {
          timeRange,
          missions: {
            total: totalMissions,
            completed: completedMissions,
            aborted: abortedMissions,
            running: runningMissions,
            paused: pausedMissions,
            completionRate: totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0
          },
          cuts: {
            total: totalCuts,
            completed: completedCuts,
            aborted: abortedCuts,
            failed: failedCuts,
            completionRate: totalCuts > 0 ? (completedCuts / totalCuts) * 100 : 0,
            avgCutsPerMission: totalMissions > 0 ? totalCuts / totalMissions : 0
          },
          performance: {
            avgMissionDurationSeconds: avgMissionDuration,
          },
          robot: {
            totalRuntimeSeconds: totalRuntime,
            commandCount: totalCommands,
            safetyEvents: safetyEvents,
            maintenanceEvents: maintenanceEvents,
            faultCount: faultEvents,
            firstOperationalTimestamp: firstEvent?.timestamp || null,
            lastOperationalTimestamp: lastEvent?.timestamp || null
          },
          safety: {
            estops,
            rejectedUnsafe
          },
          health: {
            distribution: healthDist,
            warnings: healthDist.WARNING,
            faults: healthDist.FAULT
          }
        }
      });
    } catch (e) {
      console.error('Analytics error:', e);
      return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
    }
  });
}
