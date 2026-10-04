import { NextResponse } from 'next/server';
import { validateMissionPayload } from '@/lib/api/persistence';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';
import { UserRole, MissionStatus } from '@/lib/domain';
import { realtimeBroker } from '@/lib/realtime/broker';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  return withAuth(request, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN], async (req) => {
    try {
      const body = await req.json();
      
      const validation = validateMissionPayload(body);
      if (!validation.isValid || !validation.data) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const mission = await prisma.mission.create({
        data: {
          shipName: validation.data.shipName as string,
          objective: validation.data.objective as string,
          hullSection: validation.data.hullSection as string,
          status: MissionStatus.DRAFT,
        }
      });
      
      realtimeBroker.publish({
        type: 'MISSION_UPDATED',
        source: 'API',
        timestamp: new Date().toISOString(),
        payload: mission
      });
      
      return NextResponse.json({
        message: 'Mission created successfully',
        data: mission
      }, { status: 201 });

    } catch (error: unknown) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
    }
  });
}

export async function GET(request: Request) {
  return withAuth(request, [], async () => {
    try {
      const missions = await prisma.mission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      
      return NextResponse.json({
        message: 'Fetched missions successfully',
        data: missions
      }, { status: 200 });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }
  });
}
