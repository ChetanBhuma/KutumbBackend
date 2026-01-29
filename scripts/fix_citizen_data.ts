
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCitizenData() {
  try {
    // Find citizens who are Active but might have inconsistent flags
    const activeCitizens = await prisma.seniorCitizen.findMany({
      where: {
        status: 'Active'
      }
    });

    console.log(`Found ${activeCitizens.length} active citizens.`);

    for (const citizen of activeCitizens) {
      // Fix 1: Ensure idVerificationStatus is Verified
      // Fix 2: Ensure digitalCardIssued is true

      const needsUpdate = citizen.idVerificationStatus !== 'Verified' || !citizen.digitalCardIssued;

      if (needsUpdate) {
        console.log(`Fixing citizen: ${citizen.fullName} (${citizen.id})`);

        await prisma.seniorCitizen.update({
          where: { id: citizen.id },
          data: {
            idVerificationStatus: 'Verified',
            digitalCardIssued: true,
            digitalCardIssueDate: citizen.digitalCardIssueDate || new Date()
          }
        });
        console.log('Fixed.');
      } else {
         console.log(`Citizen ${citizen.fullName} is already consistent.`);
      }
    }

  } catch (error) {
    console.error('Error fixing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCitizenData();
