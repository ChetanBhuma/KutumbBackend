import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.seniorCitizen.updateMany({
    where: {
      OR: [
        { city: null },
        { state: null }
      ]
    },
    data: {
      city: 'Delhi',
      state: 'Delhi'
    }
  });

  console.log(`Updated ${result.count} senior citizen records with city: 'Delhi', state: 'Delhi'`);

  // Verify citizen cmtibu28u000342szjcv42pt5
  const citizen = await prisma.seniorCitizen.findUnique({
    where: { id: 'cmtibu28u000342szjcv42pt5' },
    select: { id: true, fullName: true, city: true, state: true, addressLine1: true, addressLine2: true, permanentAddress: true }
  });
  console.log('Verified citizen cmtibu28u000342szjcv42pt5:', citizen);
}

main().catch(console.error).finally(() => prisma.$disconnect());
