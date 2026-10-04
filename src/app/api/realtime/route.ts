import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { realtimeBroker } from '@/lib/realtime/broker';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
  } catch (e) {
    // tests or static generation context
  }

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user || !user.id || !user.role) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection ACK
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`));

      const unsubscribe = realtimeBroker.subscribe((event) => {
        try {
          const payloadStr = JSON.stringify(event);
          controller.enqueue(encoder.encode(`event: message\ndata: ${payloadStr}\n\n`));
        } catch (err) {
          console.error('Error writing to stream', err);
        }
      });

      // Keep-alive ping every 15s to prevent proxy timeouts
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:\n\n`));
        } catch (e) {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try { controller.close(); } catch {}
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
