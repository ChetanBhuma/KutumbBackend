
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVisitHistory() {
  try {
    const citizen = await prisma.seniorCitizen.findFirst({
      where: { fullName: 'Test Citizen South' },
      include: {
        Visit: {
          include: {
            officer: true
          }
        }
      }
    });

    if (!citizen) {
      console.log('Citizen "Test Citizen South" not found.');
      return;
    }

    console.log(`Citizen Found: ${citizen.fullName} (${citizen.id})`);
    console.log('--- Visits ---');
    if (citizen.Visit.length === 0) {
      console.log('No visits found.');
    } else {
      citizen.Visit.forEach(visit => {
        console.log(`Visit ID: ${visit.id}`);
        console.log(`Type: ${visit.visitType}`);
        console.log(`Status: ${visit.status}`);
        console.log(`Scheduled: ${visit.scheduledDate}`);
        console.log(`Completed: ${visit.completedDate}`);
        console.log(`Officer: ${visit.officer.name} (${visit.officer.badgeNumber})`);
        console.log('----------------');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVisitHistory();
