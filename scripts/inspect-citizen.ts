import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const citizen = await prisma.seniorCitizen.findUnique({
    where: { id: 'cmtibu28u000342szjcv42pt5' }
  });
  console.log('Citizen cmtibu28u000342szjcv42pt5 in DB:');
  console.log('city:', citizen?.city);
  console.log('state:', citizen?.state);
  console.log('addressLine1:', citizen?.addressLine1);
  console.log('addressLine2:', citizen?.addressLine2);
  console.log('permanentAddress:', citizen?.permanentAddress);
  console.log('presentAddress:', citizen?.presentAddress);
  console.log('pinCode:', citizen?.pinCode);
  console.log('Full record:', JSON.stringify(citizen, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
