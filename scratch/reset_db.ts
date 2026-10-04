import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
  await prisma.runtimeState.update({
    where: { id: 'singleton' },
    data: { emergencyActive: false }
  });
  console.log('RuntimeState reset.');
}

reset().finally(() => prisma.$disconnect());
