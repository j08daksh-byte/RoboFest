import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';


const SINGLETON_ID = 'singleton';

async function getOrCreateState() {
  let state = await prisma.runtimeState.findUnique({ where: { id: SINGLETON_ID } });
  if (!state) {
    state = await prisma.runtimeState.create({
      data: {
        id: SINGLETON_ID,
        systemMode: 'SIMULATED',
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        armY: 0,
        armX: 0.3,
        torchEnabled: false,
        electromagnetEnabled: false,
        emergencyActive: false,
      }
    });
  }
  return state;
}

export async function GET(req: Request, context: any) {
  return withAuth(req, [], async (request, user) => {
    try {
      const state = await getOrCreateState();
      return NextResponse.json(state, { status: 200 });
    } catch (error) {
      console.error('Failed to GET runtime state:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}

export async function PATCH(req: Request, context: any) {
  return withAuth(req, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN], async (request, user) => {
    try {
      const body = await request.json();
      const state = await getOrCreateState();

      // Only allow patching specific whitelisted operational fields
      // E.g. emergencyActive, systemMode, activeMissionId
      // Physical actuator state (position, torch) should only be mutated by physical ACK (Phase 14), 
      // but we allow limited explicit syncing for the simulation boundary and safety state.

      const updateData: any = {
        stateVersion: { increment: 1 }
      };

      if (typeof body.systemMode === 'string') updateData.systemMode = body.systemMode;
      if (typeof body.emergencyActive === 'boolean') updateData.emergencyActive = body.emergencyActive;
      if (body.activeMissionId !== undefined) updateData.activeMissionId = body.activeMissionId; // can be null
      if (typeof body.lastCommandId === 'string') updateData.lastCommandId = body.lastCommandId;

      // In simulation mode, the frontend can patch actuator state directly
      if (body.systemMode === 'SIMULATED' || state.systemMode === 'SIMULATED') {
        if (typeof body.positionX === 'number') updateData.positionX = body.positionX;
        if (typeof body.positionY === 'number') updateData.positionY = body.positionY;
        if (typeof body.positionZ === 'number') updateData.positionZ = body.positionZ;
        if (typeof body.armX === 'number') updateData.armX = body.armX;
        if (typeof body.armY === 'number') updateData.armY = body.armY;
        if (typeof body.torchEnabled === 'boolean') updateData.torchEnabled = body.torchEnabled;
        if (typeof body.electromagnetEnabled === 'boolean') updateData.electromagnetEnabled = body.electromagnetEnabled;
      }

      const updated = await prisma.runtimeState.update({
        where: { id: SINGLETON_ID },
        data: updateData
      });

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      console.error('Failed to PATCH runtime state:', error);
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }
  });
}
