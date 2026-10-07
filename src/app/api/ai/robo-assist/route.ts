import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authBoundary';
import { processRoboAssistQuery } from '@/lib/ai/engine';
import { prisma } from '@/lib/prisma';



export async function POST(request: Request) {
  return withAuth(request, [], async (req, user) => {
    try {
      const { query } = await req.json();
      
      if (!query || typeof query !== 'string') {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      const response = await processRoboAssistQuery(query, user.id as string);

      // Log the interaction
      await prisma.eventLog.create({
        data: {
          category: 'SYSTEM',
          type: 'AI_RECOMMENDATION_CREATED',
          severity: 'INFO',
          message: `Robo-Assist responded to: "${query}"`,
          metadata: JSON.stringify(response),
          userId: user.id as string
        }
      });

      return NextResponse.json({ data: response }, { status: 200 });

    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to process AI query' }, { status: 500 });
    }
  });
}
