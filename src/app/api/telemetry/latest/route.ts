import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';



export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(request, [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.ADMIN, UserRole.SUPERVISOR], async (req) => {
    try {
      const url = new URL(request.url);
      const mode = url.searchParams.get('mode') || 'SIMULATED';

      const record = await prisma.telemetryRecord.findFirst({
        where: { mode },
        orderBy: { timestamp: 'desc' },
      });

      if (!record) {
        return NextResponse.json({ error: 'No telemetry found' }, { status: 404 });
      }

      return NextResponse.json({ data: record }, { status: 200 });
    } catch (e: any) {
      console.error(e);
      return NextResponse.json({ error: 'Failed to fetch latest telemetry' }, { status: 500 });
    }
  });
}
