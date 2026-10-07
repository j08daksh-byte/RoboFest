import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authBoundary';
import { UserRole } from '@/lib/domain';


const ALLOWED_ROLES = [UserRole.OPERATOR, UserRole.ENGINEER, UserRole.SUPERVISOR, UserRole.ADMIN];

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return withAuth(request, ALLOWED_ROLES, async (req, user) => {
    try {
      const { id } = await context.params;
      
      const commandRecord = await prisma.commandRecord.findUnique({
        where: { commandId: id }
      });

      if (!commandRecord) {
        return NextResponse.json({ error: 'Command not found' }, { status: 404 });
      }

      // IDOR Protection: Operators can only read their own commands. 
      // Higher roles can read any command.
      if (user.role === UserRole.OPERATOR && commandRecord.operatorId !== user.id) {
        return NextResponse.json({ error: 'Forbidden: Cannot access command of another user' }, { status: 403 });
      }

      return NextResponse.json(commandRecord, { status: 200 });

    } catch (error) {
      console.error('[API] Command lookup failed:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
