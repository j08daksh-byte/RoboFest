import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authBoundary';
import { generateDeterministicStrategy } from '@/lib/cutting/strategy';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  return withAuth(request, [], async (req, user) => {
    try {
      const body = await req.json();
      
      if (!body.cut) {
        return NextResponse.json({ error: 'Cut definition is required' }, { status: 400 });
      }

      // Generate the deterministic strategy / AI advisory recommendation
      const strategy = generateDeterministicStrategy(body.cut);

      // Log the recommendation creation
      await prisma.eventLog.create({
        data: {
          category: 'SYSTEM',
          type: 'AI_RECOMMENDATION_CREATED',
          severity: 'INFO',
          message: `AI Strategy generated recommendation for cut ${body.cut.id}`,
          metadata: JSON.stringify(strategy),
          userId: user.id as string
        }
      });

      return NextResponse.json({ data: strategy }, { status: 200 });

    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to process AI strategy' }, { status: 500 });
    }
  });
}
