import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';



export async function GET(req: Request, context: any) {
  return withAuth(req, [], async () => {
    const { id } = await context.params;
    const mission = await prisma.mission.findUnique({ where: { id } });
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: mission }, { status: 200 });
  });
}

export async function PATCH(req: Request, context: any) {
  return withAuth(req, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN], async (request) => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      
      const mission = await prisma.mission.findUnique({ where: { id } });
      if (!mission) {
        return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
      }

      // Restrict fields that can be patched (No status updates here, use /transition for state machine)
      const updateData: any = {};
      if (typeof body.progressPercentage === 'number') {
        updateData.progressPercentage = body.progressPercentage;
      }
      if (typeof body.objective === 'string') {
        updateData.objective = body.objective;
      }
      if (typeof body.shipName === 'string') {
        updateData.shipName = body.shipName;
      }

      const updated = await prisma.mission.update({
        where: { id },
        data: updateData
      });

      return NextResponse.json({ data: updated }, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }
  });
}
