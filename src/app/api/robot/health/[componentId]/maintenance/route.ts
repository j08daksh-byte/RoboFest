import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';

const prisma = new PrismaClient();

// Only higher-tier users can post maintenance
const POST_ROLES = [UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN];
const GET_ROLES = [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN];

export async function GET(request: Request, context: { params: Promise<{ componentId: string }> }) {
  return withAuth(request, GET_ROLES, async () => {
    try {
      const { componentId } = await context.params;
      
      const records = await prisma.maintenanceRecord.findMany({
        where: { componentId },
        orderBy: { performedAt: 'desc' }
      });

      return NextResponse.json(records, { status: 200 });
    } catch (error) {
      console.error('[API] Maintenance fetch failed:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}

export async function POST(request: Request, context: { params: Promise<{ componentId: string }> }) {
  return withAuth(request, POST_ROLES, async (req, user) => {
    try {
      const { componentId } = await context.params;
      const body = await req.json();
      
      const { maintenanceType, description, notes, nextServiceCondition } = body;

      if (!maintenanceType || !description) {
        return NextResponse.json({ error: 'Missing required maintenance fields' }, { status: 400 });
      }

      const comp = await prisma.componentHealth.findUnique({ where: { componentId } });
      if (!comp) {
        return NextResponse.json({ error: 'Component not found' }, { status: 404 });
      }

      const dbUser = await prisma.user.findUnique({ where: { id: user.id as string } });
      const performedBy = dbUser?.username || (user.id as string);

      const record = await prisma.maintenanceRecord.create({
        data: {
          componentId,
          maintenanceType,
          description,
          notes,
          nextServiceCondition,
          performedBy,
          runtimeAtService: comp.runtimeSeconds
        }
      });

      await prisma.componentHealth.update({
        where: { componentId },
        data: { 
          lastMaintenanceAt: new Date(),
          status: 'HEALTHY',
          faultState: null
        }
      });

      await prisma.eventLog.create({
        data: {
          category: 'MAINTENANCE',
          type: 'COMPLETED',
          severity: 'INFO',
          message: `Maintenance performed on ${comp.name}: ${maintenanceType}`,
          metadata: JSON.stringify({ componentId, maintenanceType }),
          userId: user.id as string
        }
      });

      return NextResponse.json(record, { status: 200 });
    } catch (error) {
      console.error('[API] Maintenance create failed:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
