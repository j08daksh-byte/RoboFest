import { NextResponse } from 'next/server';
import { validateMissionPayload } from '@/lib/api/persistence';

export async function POST(request: Request) {
  try {
    // TODO: Phase 10C Auth Enforcement (Verify JWT and permissions)
    const body = await request.json();
    
    const validation = validateMissionPayload(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // [REQUIRES DB DECISION]
    // DB.mission.create({ data: validation.data })
    
    // Stub response for now
    return NextResponse.json({
      message: 'Mission created successfully (Stub)',
      data: {
        id: crypto.randomUUID(),
        ...validation.data,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }
}

export async function GET() {
  // TODO: Phase 10C Auth Enforcement
  
  // [REQUIRES DB DECISION]
  // const missions = await DB.mission.findMany()
  
  return NextResponse.json({
    message: 'Fetched missions successfully (Stub)',
    data: []
  }, { status: 200 });
}
