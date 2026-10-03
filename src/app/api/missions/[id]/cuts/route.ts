import { NextResponse } from 'next/server';
import { validateCutPayload } from '@/lib/api/persistence';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, [UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN], async (req) => {
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

      const cutRecord = await prisma.cutRecord.create({
        data: {
          missionId: validation.data.missionId as string,
          geometryJson: validation.data.geometryJson as string,
          status: 'PLANNED'
        }
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
