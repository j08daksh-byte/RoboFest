import { NextResponse } from 'next/server';
import { validateCutPayload } from '@/lib/api/persistence';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';
import { realtimeBroker } from '@/lib/realtime/broker';



export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, [], async () => {
    const resolvedParams = await params;
    const mission = await prisma.mission.findUnique({ where: { id: resolvedParams.id } });
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    const cuts = await prisma.cutRecord.findMany({ 
      where: { missionId: resolvedParams.id },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json({ data: cuts }, { status: 200 });
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN], async (req, user) => {
    try {
      const resolvedParams = await params;
      const body = await req.json();
      
      const validation = validateCutPayload(body, resolvedParams.id);
      if (!validation.isValid || !validation.data) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Check if parent mission exists
      const mission = await prisma.mission.findUnique({
        where: { id: resolvedParams.id }
      });

      if (!mission) {
        return NextResponse.json({ error: 'Parent mission not found' }, { status: 404 });
      }

      const cutName = validation.data.name as string || `Cut-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const cutRecord = await prisma.cutRecord.create({
        data: {
          missionId: validation.data.missionId as string,
          name: cutName,
          type: validation.data.type as string,
          status: 'PLANNED',
          photoPlanJson: validation.data.photoPlanJson as string | null,
          normalizedJson: validation.data.normalizedJson as string | null,
          worldJson: validation.data.worldJson as string | null,
          panelId: validation.data.panelId as string | null,
          plannedAt: new Date()
        }
      });
      
      await prisma.eventLog.create({
        data: {
          category: 'CUT',
          type: 'CREATED',
          severity: 'INFO',
          message: `Cut ${cutRecord.name} created and PLANNED for mission ${mission.shipName}`,
          missionId: mission.id,
          cutId: cutRecord.id,
          userId: user.id as string
        }
      });
      realtimeBroker.publish({
        type: 'CUT_UPDATED',
        source: 'API',
        timestamp: new Date().toISOString(),
        payload: cutRecord
      });

      return NextResponse.json({
        message: 'Cut plan saved successfully',
        data: cutRecord
      }, { status: 201 });

    } catch (error: unknown) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to save cut plan' }, { status: 500 });
    }
  });
}
