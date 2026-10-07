import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';
import { initializeComponentHealth } from '@/lib/health/healthEngine';


const ALLOWED_ROLES = [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN];

export async function GET(request: Request) {
  return withAuth(request, ALLOWED_ROLES, async () => {
    try {
      let components = await prisma.componentHealth.findMany({
        include: { maintenanceRecords: { orderBy: { performedAt: 'desc' }, take: 1 } }
      });

      if (components.length === 0) {
        await initializeComponentHealth();
        components = await prisma.componentHealth.findMany({
          include: { maintenanceRecords: { orderBy: { performedAt: 'desc' }, take: 1 } }
        });
      }

      return NextResponse.json({ components }, { status: 200 });
    } catch (error) {
      console.error('[API] Health fetch failed:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
