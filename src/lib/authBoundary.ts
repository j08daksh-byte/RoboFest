import { NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { UserRole } from './domain';

export async function withAuth(
  request: Request,
  allowedRoles: UserRole[],
  handler: (req: Request, user: Record<string, unknown>) => Promise<NextResponse>
) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];
  const user = await verifyToken(token);
  
  if (!user || !user.id || !user.role) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token payload' }, { status: 401 });
  }
  
  // Authorization Boundary
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions for this operation' }, { status: 403 });
  }
  
  return handler(request, user);
}
