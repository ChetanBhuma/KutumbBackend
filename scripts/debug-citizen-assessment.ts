
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const searchTerm = "Test New Citizen";
    // Find the citizen
    const citizen = await prisma.seniorCitizen.findFirst({
        where: {
            fullName: { contains: searchTerm }
        }
    });

    if (!citizen) {
        console.log(`Citizen not found matching "${searchTerm}"`);
        return;
    }

    console.log(`Found Citizen: ${citizen.fullName} (ID: ${citizen.id})`);

    // Get visits
    const visits = await prisma.visit.findMany({
        where: { seniorCitizenId: citizen.id },
        orderBy: { scheduledDate: 'desc' },
        take: 5
    });

    console.log(`Found ${visits.length} recent visits.`);

    visits.forEach(v => {
        console.log('------------------------------------------------');
        console.log(`Visit ID: ${v.id}`);
        console.log(`Status: ${v.status}`);
        console.log(`Type: ${v.visitType}`);
        console.log(`Date: ${v.scheduledDate}`);
        console.log(`Has assessmentData: ${!!v.assessmentData}`);
        if (v.assessmentData) {
            console.log('Assessment Data Preview:', JSON.stringify(v.assessmentData).substring(0, 200) + '...');
            console.log('Keys:', Object.keys(v.assessmentData as object));
        }
    });

  } catch (error) {
    console.error('Error debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
