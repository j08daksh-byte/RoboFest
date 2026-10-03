import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/lib/domain';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    // In a real app, hash password and compare. Here we just do a direct match for the demo or simple hash.
    // We will auto-provision the dev user if it doesn't exist for testing.
    let user = await prisma.user.findUnique({ where: { username } });

    if (!user && username === 'admin' && password === 'admin') {
      user = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: 'admin', // Simple for dev validation
          role: UserRole.ADMIN
        }
      });
    }

    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    return NextResponse.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }
}
