import { NextResponse } from 'next/server';
import { validateEventPayload } from '@/lib/api/persistence';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Empty allowed roles array means any authenticated user can post an event
  return withAuth(request, [], async (req, user) => {
    try {
      const body = await req.json();
      
      const validation = validateEventPayload(body);
      if (!validation.isValid || !validation.data) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Avoid creating missing mission link if provided mission is invalid
      let validMissionId = null;
      if (validation.data.missionId) {
        const mission = await prisma.mission.findUnique({
          where: { id: validation.data.missionId as string }
        });
        if (mission) validMissionId = mission.id;
      }

      const eventLog = await prisma.eventLog.create({
        data: {
          category: validation.data.category as string,
          message: validation.data.message as string,
          severity: validation.data.severity as string,
          missionId: validMissionId,
          userId: user.id as string
        }
      });
      
      return NextResponse.json({
        message: 'Event logged successfully',
        data: eventLog
      }, { status: 201 });

    } catch (error: unknown) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }
  });
}
