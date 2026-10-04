import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ id: string, cutId: string }> }) {
  return withAuth(request, [], async () => {
    const resolvedParams = await params;
    const { id: missionId, cutId } = resolvedParams;
    
    const cut = await prisma.cutRecord.findUnique({ where: { id: cutId } });
    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 });
    }

    if (cut.missionId !== missionId) {
      return NextResponse.json({ error: 'Cut does not belong to this mission' }, { status: 400 });
    }
    
    return NextResponse.json({ data: cut }, { status: 200 });
  });
}
