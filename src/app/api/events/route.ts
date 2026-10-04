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
          type: validation.data.type as string | undefined,
          message: validation.data.message as string,
          severity: validation.data.severity as string,
          source: validation.data.source as string,
          missionId: validMissionId,
          cutId: validation.data.cutId as string | undefined,
          commandId: validation.data.commandId as string | undefined,
          robotId: validation.data.robotId as string | undefined,
          metadata: validation.data.metadata as string | undefined,
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

export async function GET(request: Request) {
  return withAuth(request, [], async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // Parse query params
      const limit = parseInt(searchParams.get('limit') || '100', 10);
      const category = searchParams.get('category');
      const severity = searchParams.get('severity');
      const source = searchParams.get('source');
      const missionId = searchParams.get('missionId');
      const cutId = searchParams.get('cutId');
      const commandId = searchParams.get('commandId');
      const robotId = searchParams.get('robotId');
      
      const safeLimit = Math.min(Math.max(1, limit), 1000);
      
      const where: any = {};
      if (category) where.category = category;
      if (severity) where.severity = severity;
      if (source) where.source = source;
      if (missionId) where.missionId = missionId;
      if (cutId) where.cutId = cutId;
      if (commandId) where.commandId = commandId;
      if (robotId) where.robotId = robotId;
      
      const events = await prisma.eventLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: safeLimit,
        include: {
          user: { select: { username: true, role: true } }
        }
      });
      
      return NextResponse.json({
        data: events,
        meta: {
          count: events.length,
          limit: safeLimit
        }
      });
    } catch (error: unknown) {
      console.error('Failed to query events', error);
      return NextResponse.json({ error: 'Failed to query events' }, { status: 500 });
    }
  });
}
