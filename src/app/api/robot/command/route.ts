import { NextResponse } from 'next/server';
import { RobotCommand, validateCommand, CommandResult } from '@/lib/api/commands';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';

const prisma = new PrismaClient();

// Allowed roles for commands. E-Stop is allowed for all authorized users.
const ALLOWED_ROLES = [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN];

export async function POST(request: Request) {
  return withAuth(request, ALLOWED_ROLES, async (req, user) => {
    try {
      const body = await req.json();
      
      // 1. Structural Validation
      const validation = validateCommand(body);
      if (!validation.isValid) {
        return NextResponse.json({
          commandId: body.id || 'unknown',
          status: 'REJECTED',
          reason: validation.error,
          timestamp: new Date().toISOString()
        } as CommandResult, { status: 400 });
      }

      const command = body as RobotCommand;
      
      // 2. Authorization boundary checks
      // Any authenticated operator can emergency stop.
      // For movement/torch, we could restrict further if needed, but the prompt says 
      // "implement the smallest explicit permission boundary needed". 
      // Current ALLOWED_ROLES list handles the minimum requirement.
      
      // 3. Idempotency & Persistence
      try {
        const payloadStr = 'payload' in command ? JSON.stringify(command.payload) : '{}';
        
        await prisma.commandRecord.create({
          data: {
            commandId: command.id,
            type: command.type,
            status: 'PENDING',
            operatorId: user.id as string,
            source: command.source,
            payload: payloadStr,
          }
        });
      } catch (dbError: any) {
        // Unique constraint violation (duplicate command ID)
        if (dbError.code === 'P2002') {
          const existingCommand = await prisma.commandRecord.findUnique({
            where: { commandId: command.id }
          });
          
          if (existingCommand) {
             return NextResponse.json({
               commandId: existingCommand.commandId,
               status: existingCommand.status,
               reason: 'Duplicate command submitted',
               timestamp: new Date().toISOString()
             } as CommandResult, { status: 200 });
          }
        }
        
        console.error('[API] Command persistence failed:', dbError);
        return NextResponse.json({
          commandId: command.id,
          status: 'REJECTED',
          reason: 'Database persistence failed',
          timestamp: new Date().toISOString()
        } as CommandResult, { status: 500 });
      }

      // 4. Return truthful status (ACCEPTED/PENDING)
      // Command is persisted in DB, waiting for transport to pick it up.
      const result: CommandResult = {
        commandId: command.id,
        status: 'ACCEPTED', // The frontend contract uses ACCEPTED interchangeably with PENDING for initial response
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(result, { status: 200 });
      
    } catch {
      return NextResponse.json({
        commandId: 'unknown',
        status: 'REJECTED',
        reason: 'Malformed JSON',
        timestamp: new Date().toISOString()
      } as CommandResult, { status: 400 });
    }
  });
}
