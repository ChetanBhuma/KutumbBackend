import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyBadgeNumbers() {
  console.log('Verifying badge numbers...');

  try {
    const officers = await prisma.beatOfficer.findMany();

    let valid = 0;
    let invalid = 0;

    for (const officer of officers) {
       // Check if 8 digit numeric
       if (/^\d{8}$/.test(officer.badgeNumber)) {
           valid++;
       } else {
           invalid++;
           console.log(`Invalid badge number for officer ${officer.id}: ${officer.badgeNumber}`);
       }
    }

    console.log(`Total officers: ${officers.length}`);
    console.log(`Valid badge numbers: ${valid}`);
    console.log(`Invalid badge numbers: ${invalid}`);

    if (invalid === 0) {
        console.log("SUCCESS: All badge numbers are valid.");
    } else {
        console.log("FAILURE: Some badge numbers are invalid.");
    }

  } catch (error) {
    console.error('Error verifying badge numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBadgeNumbers();
