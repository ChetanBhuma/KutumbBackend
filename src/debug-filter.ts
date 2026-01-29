
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFilter() {
  try {
    console.log('Testing Prisma filter...');

    // 1. Count all
    const allCount = await prisma.seniorCitizen.count();
    console.log(`Total count: ${allCount}`);

    // 2. Count with idVerificationStatus = 'Verified'
    const verifiedCount = await prisma.seniorCitizen.count({
        where: {
            idVerificationStatus: 'Verified'
        }
    });
    console.log(`Verified count (expecting 0): ${verifiedCount}`);

     // 3. Count with idVerificationStatus = 'Pending'
    const pendingCount = await prisma.seniorCitizen.count({
        where: {
            idVerificationStatus: 'Pending'
        }
    });
    console.log(`Pending count (expecting >0): ${pendingCount}`);

    // 4. Test exact match logic simulation
    const queryStub = {
        verificationStatus: 'Verified',
        idVerificationStatus: 'Verified'
    };

    // Simulate buildWhereClause logic
    const where: any = {};
    if (queryStub.idVerificationStatus) {
        where.idVerificationStatus = String(queryStub.idVerificationStatus);
    }

    console.log('Simulated Where:', where);
    const simCount = await prisma.seniorCitizen.count({ where });
    console.log(`Simulated count: ${simCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFilter();
