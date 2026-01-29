
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const citizens = await prisma.seniorCitizen.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fullName: true,
        mobileNumber: true,
        status: true,
        idVerificationStatus: true,
        digitalCardIssued: true,
        digitalCardIssueDate: true
      }
    });

    console.log(JSON.stringify(citizens, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
