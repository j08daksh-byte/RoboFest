import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Vercel's filesystem is read-only except /tmp, so copy the bundled SQLite DB there.
function resolveDatasourceUrl(): string | undefined {
  if (!process.env.VERCEL) return undefined;
  const tmpDb = '/tmp/dev.db';
  try {
    if (!fs.existsSync(tmpDb)) {
      const bundled = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(bundled)) fs.copyFileSync(bundled, tmpDb);
    }
  } catch (e) {
    console.warn('Could not prepare /tmp SQLite DB', e);
  }
  return `file:${tmpDb}`;
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: resolveDatasourceUrl() });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
