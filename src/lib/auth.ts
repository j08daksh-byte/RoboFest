import { jwtVerify, SignJWT } from 'jose';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: JWT_SECRET is not set in production. Using fallback secret.');
  }
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod-robo-fest-6');

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
