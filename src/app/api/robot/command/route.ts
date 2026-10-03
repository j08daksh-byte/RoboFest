import { NextResponse } from 'next/server';
import { RobotCommand, validateCommand, CommandResult } from '@/lib/api/commands';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Structural Validation
    const validation = validateCommand(body);
    if (!validation.isValid) {
      const result: CommandResult = {
        commandId: body.id || 'unknown',
        status: 'REJECTED',
        reason: validation.error,
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(result, { status: 400 });
    }

    const command = body as RobotCommand;
    
    // 2. Acceptance
    // Note: We do NOT directly mutate Zustand state from the server side. 
    // Zustand is a client-side store in this architecture.
    // We also do not have ESP32 connected yet. 
    // This gateway currently validates the command and acknowledges acceptance.
    // The "Future Command Dispatcher" will read this and push to Hardware.
    // The existing platform authority remains in the client-side browser simulator for now.

    const result: CommandResult = {
      commandId: command.id,
      status: 'ACCEPTED',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (err) {
    return NextResponse.json({
      commandId: 'unknown',
      status: 'REJECTED',
      reason: 'Malformed JSON',
      timestamp: new Date().toISOString()
    } as CommandResult, { status: 400 });
  }
}
