import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { UserRole } from './domain';

export async function withAuth(
  request: Request,
  allowedRoles: UserRole[],
  handler: (req: Request, user: Record<string, unknown>) => Promise<NextResponse>
) {
  const authHeader = request.headers.get('authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value;
    } catch (e) {
      // In tests, cookies() might throw if not in Next context
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
  }
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
