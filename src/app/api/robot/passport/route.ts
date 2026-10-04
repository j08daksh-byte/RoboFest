import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';

const prisma = new PrismaClient();
const ALLOWED_ROLES = [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN];

export async function GET(request: Request) {
  return withAuth(request, ALLOWED_ROLES, async () => {
    try {
      let stats = await prisma.lifetimeStatistic.findUnique({
        where: { id: 'singleton' }
      });

      if (!stats) {
        stats = await prisma.lifetimeStatistic.create({
          data: { id: 'singleton' }
        });
      }

      return NextResponse.json(stats, { status: 200 });
    } catch (error) {
      console.error('[API] Passport fetch failed:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
