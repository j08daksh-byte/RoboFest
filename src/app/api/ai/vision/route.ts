import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authBoundary';
import { simulateVisionCandidate } from '@/lib/ai/engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  return withAuth(request, [], async (req, user) => {
    try {
      const candidate = simulateVisionCandidate();

      // Log the interaction
      await prisma.eventLog.create({
        data: {
          category: 'SYSTEM',
          type: 'VISION_CANDIDATE_CREATED',
          severity: 'INFO',
          message: `Vision system detected potential cut candidate at ${candidate.detectedRegion}`,
          metadata: JSON.stringify(candidate),
          userId: user.id as string
        }
      });

      return NextResponse.json({ data: candidate }, { status: 200 });

    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to process vision query' }, { status: 500 });
    }
  });
}
