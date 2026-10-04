import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma1 = new PrismaClient();
  const testId = `test-mission-${Date.now()}`;
  
  console.log('1. Connecting and Writing...');
  await prisma1.mission.create({
    data: {
      id: testId,
      shipName: 'Test Persistence Ship',
      objective: 'Prove DB writes',
      hullSection: 'Test Hull',
      status: 'TEST'
    }
  });
  await prisma1.$disconnect();
  console.log('2. Disconnected first client.');

  console.log('3. Reconnecting with new client...');
  const prisma2 = new PrismaClient();
  const result = await prisma2.mission.findUnique({
    where: { id: testId }
  });
  
  if (result && result.shipName === 'Test Persistence Ship') {
    console.log('4. SUCCESS: Record read successfully across reconnection. Persistence verified.');
  } else {
    console.error('4. FAILED: Record not found.');
  }
  
  // Cleanup
  await prisma2.mission.delete({ where: { id: testId } });
  await prisma2.$disconnect();
}

main().catch(console.error);
