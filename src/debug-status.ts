
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVerificationStatuses() {
  try {
    const citizens = await prisma.seniorCitizen.findMany({
      select: {
        id: true,
        fullName: true,
        idVerificationStatus: true
      }
    });

    console.log('Total Citizens:', citizens.length);
    console.log('--- Verification Statuses ---');
    citizens.forEach(c => {
        console.log(`ID: ${c.id}, Name: ${c.fullName}, Status: '${c.idVerificationStatus}'`);
    });

    const uniqueStatuses = [...new Set(citizens.map(c => c.idVerificationStatus))];
    console.log('Unique Statuses:', uniqueStatuses);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVerificationStatuses();
