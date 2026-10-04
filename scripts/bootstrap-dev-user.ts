import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: This script is explicitly for development only and cannot be run in production.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function bootstrap() {
  console.log('--- DEVELOPMENT BOOTSTRAP ---');
  console.log('Provisioning development admin user...');

  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: 'admin',
      role: 'ADMIN'
    },
    create: {
      username: 'admin',
      passwordHash: 'admin', // Simple for dev validation only
      role: 'ADMIN'
    }
  });

  console.log(`Success! Provisioned user: ${user.username}`);
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
