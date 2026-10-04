import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';
import { evaluateServerSafety } from '@/lib/safety/serverSafety';


const prisma = new PrismaClient();

const VALID_TRANSITIONS: Record<string, string[]> = {
  'PLANNED': ['READY'],
  'READY': ['RUNNING', 'PENDING'],
  'RUNNING': ['COMPLETED', 'ABORTED', 'FAILED'],
  'PENDING': ['COMPLETED', 'ABORTED', 'FAILED'],
  'COMPLETED': [],
  'ABORTED': [],
  'FAILED': [],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string, cutId: string }> }) {
  return withAuth(request, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN], async (req, user) => {
    try {
      const resolvedParams = await params;
      const { id: missionId, cutId } = resolvedParams;
      const { action } = await req.json();

      if (!['PREPARE', 'SIMULATE', 'QUEUE', 'COMPLETE', 'ABORT', 'FAIL'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return await prisma.$transaction(async (tx) => {
        const cut = await tx.cutRecord.findUnique({ where: { id: cutId } });
        if (!cut) return NextResponse.json({ error: 'Cut not found' }, { status: 404 });
        if (cut.missionId !== missionId) return NextResponse.json({ error: 'Cut does not belong to mission' }, { status: 400 });

        let targetStatus = '';
        if (action === 'PREPARE') targetStatus = 'READY';
        if (action === 'SIMULATE') targetStatus = 'RUNNING';
        if (action === 'QUEUE') targetStatus = 'PENDING';
        if (action === 'COMPLETE') targetStatus = 'COMPLETED';
        if (action === 'ABORT') targetStatus = 'ABORTED';
        if (action === 'FAIL') targetStatus = 'FAILED';

        const currentStatus = cut.status;
        
        if (!VALID_TRANSITIONS[currentStatus]?.includes(targetStatus)) {
          await tx.eventLog.create({
            data: {
              category: 'CUT',
              type: 'INVALID_TRANSITION',
              severity: 'WARNING',
              message: `Invalid cut transition: ${currentStatus} -> ${targetStatus}`,
              missionId,
              cutId: cut.id,
              userId: user.id as string
            }
          });
          return NextResponse.json({ error: `Invalid transition from ${currentStatus} to ${targetStatus}` }, { status: 400 });
        }

        if (targetStatus === 'RUNNING' || targetStatus === 'PENDING') {
          const safetyEval = await evaluateServerSafety('CUT_START', user.id as string, user.role as string);
          if (!safetyEval.allowed) {
            await tx.eventLog.create({
              data: {
                category: 'SAFETY',
                type: 'UNSAFE_CUT',
                severity: 'CRITICAL',
                message: `SAFETY_CUT_REJECTED: ${safetyEval.reasons.join(', ')}`,
                missionId,
                cutId: cut.id,
                userId: user.id as string
              }
            });
            return NextResponse.json({ error: `Safety failure: ${safetyEval.reasons.join(', ')}` }, { status: 409 });
          }
        }

        const updateData: any = {
          status: targetStatus,
          stateVersion: { increment: 1 }
        };

        if (targetStatus === 'RUNNING' || targetStatus === 'PENDING') updateData.startedAt = new Date();
        if (targetStatus === 'COMPLETED') updateData.completedAt = new Date();
        if (targetStatus === 'ABORTED') updateData.abortedAt = new Date();

        const updatedCut = await tx.cutRecord.update({
          where: { id: cutId },
          data: updateData
        });

        await tx.eventLog.create({
          data: {
            category: 'CUT',
            type: targetStatus, // e.g. RUNNING, PENDING, COMPLETED, ABORTED, FAILED
            severity: targetStatus === 'FAILED' || targetStatus === 'ABORTED' ? 'WARNING' : 'INFO',
            message: `Cut ${cut.name} transition to ${targetStatus}`,
            missionId,
            cutId: cut.id,
            userId: user.id as string
          }
        });



        return NextResponse.json({ data: updatedCut }, { status: 200 });
      });

    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }
  });
}
