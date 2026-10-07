import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authBoundary';
import { UserRole, MissionStatus } from '@/lib/domain';
import { evaluateServerSafety } from '@/lib/safety/serverSafety';
import { realtimeBroker } from '@/lib/realtime/broker';



const VALID_TRANSITIONS: Record<string, string[]> = {
  [MissionStatus.DRAFT]: [MissionStatus.READY],
  [MissionStatus.READY]: [MissionStatus.RUNNING],
  [MissionStatus.RUNNING]: [MissionStatus.PAUSED, MissionStatus.COMPLETED, MissionStatus.ABORTED],
  [MissionStatus.PAUSED]: [MissionStatus.RUNNING, MissionStatus.COMPLETED, MissionStatus.ABORTED],
  [MissionStatus.COMPLETED]: [],
  [MissionStatus.ABORTED]: [],
};

export async function POST(req: Request, context: any) {
  return withAuth(req, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN], async (request, user) => {
    try {
      const { id } = await context.params;
      const { action } = await request.json();

      if (!['READY', 'START', 'PAUSE', 'RESUME', 'COMPLETE', 'ABORT'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return await prisma.$transaction(async (tx) => {
        const mission = await tx.mission.findUnique({ where: { id } });
        if (!mission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        let targetStatus = '';
        if (action === 'READY') targetStatus = MissionStatus.READY;
        if (action === 'START') targetStatus = MissionStatus.RUNNING;
        if (action === 'PAUSE') targetStatus = MissionStatus.PAUSED;
        if (action === 'RESUME') targetStatus = MissionStatus.RUNNING;
        if (action === 'COMPLETE') targetStatus = MissionStatus.COMPLETED;
        if (action === 'ABORT') targetStatus = MissionStatus.ABORTED;

        const currentStatus = mission.status;
        
        if (!VALID_TRANSITIONS[currentStatus]?.includes(targetStatus)) {
          await tx.eventLog.create({
            data: {
              category: 'MISSION',
              type: 'INVALID_TRANSITION',
              severity: 'WARNING',
              message: `Invalid transition: ${currentStatus} -> ${targetStatus}`,
              missionId: mission.id,
              userId: user.id as string
            }
          });
          return NextResponse.json({ error: `Invalid transition from ${currentStatus} to ${targetStatus}` }, { status: 400 });
        }

        const runtimeState = await tx.runtimeState.findUnique({ where: { id: 'singleton' } });
        if (!runtimeState) return NextResponse.json({ error: 'System state uninitialized' }, { status: 500 });

        // Safety gate check
        if ((targetStatus === MissionStatus.RUNNING && action === 'START') || action === 'RESUME') {
          const safetyEval = await evaluateServerSafety('MISSION_START', user.id as string, user.role as string);
          if (!safetyEval.allowed) {
            await tx.eventLog.create({
              data: {
                category: 'SAFETY',
                type: 'UNSAFE_MISSION',
                severity: 'CRITICAL',
                message: `SAFETY_MISSION_REJECTED: ${safetyEval.reasons.join(', ')}`,
                missionId: mission.id,
                userId: user.id as string
              }
            });
            return NextResponse.json({ error: `Safety failure: ${safetyEval.reasons.join(', ')}` }, { status: 409 });
          }

          if (runtimeState.activeMissionId && runtimeState.activeMissionId !== mission.id) {
            return NextResponse.json({ error: 'Another mission is already active' }, { status: 409 });
          }
        }

        const updateData: any = {
          status: targetStatus,
          stateVersion: { increment: 1 }
        };

        if (action === 'START') updateData.startedAt = new Date();
        if (action === 'PAUSE') updateData.pausedAt = new Date();
        if (action === 'COMPLETE') updateData.completedAt = new Date();
        if (action === 'ABORT') updateData.abortedAt = new Date();

        const updatedMission = await tx.mission.update({
          where: { id },
          data: updateData
        });

        // Update runtime state
        if (targetStatus === MissionStatus.RUNNING) {
          await tx.runtimeState.update({
            where: { id: 'singleton' },
            data: { activeMissionId: mission.id }
          });
        } else if (targetStatus === MissionStatus.COMPLETED || targetStatus === MissionStatus.ABORTED) {
          if (runtimeState.activeMissionId === mission.id) {
            await tx.runtimeState.update({
              where: { id: 'singleton' },
              data: { activeMissionId: null }
            });
          }
        }

        await tx.eventLog.create({
          data: {
            category: 'MISSION',
            type: targetStatus, // e.g. RUNNING, PAUSED, COMPLETED
            severity: 'INFO',
            message: `Mission transitioned to ${targetStatus}`,
            missionId: mission.id,
            userId: user.id as string
          }
        });

        if (targetStatus === MissionStatus.COMPLETED) {
          let runtime = 0;
          if (mission.startedAt) {
            runtime = Math.floor((new Date().getTime() - new Date(mission.startedAt).getTime()) / 1000);
          }
        }

        realtimeBroker.publish({
          type: 'MISSION_UPDATED',
          source: 'API',
          timestamp: new Date().toISOString(),
          payload: updatedMission
        });

        realtimeBroker.publish({
          type: 'MISSION_UPDATED',
          source: 'API',
          timestamp: new Date().toISOString(),
          payload: updatedMission
        });

        return NextResponse.json({ data: updatedMission }, { status: 200 });
      });
    } catch (error) {
      console.error('Transition error', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
