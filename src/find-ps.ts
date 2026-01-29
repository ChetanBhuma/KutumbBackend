
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findData() {
  try {
    const psWithCitizens = await prisma.policeStation.findFirst({
        where: {
            SeniorCitizen: {
                some: {}
            }
        }
    });

    if (!psWithCitizens) {
        console.log('No Police Stations with citizens found');
        return;
    }
    const ps = psWithCitizens;

    console.log(`Using Police Station: ${ps.name} (${ps.id})`);

    const citizens = await prisma.seniorCitizen.count({ where: { policeStationId: ps.id } });
    console.log(`Citizens in PS: ${citizens}`);

    const officers = await prisma.beatOfficer.count({ where: { policeStationId: ps.id } });
    console.log(`Officers in PS: ${officers}`);

    const officersWithBeat = await prisma.beatOfficer.count({
        where: {
            policeStationId: ps.id,
            beatId: { not: null }
        }
    });
    console.log(`Officers in PS with Beat: ${officersWithBeat}`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

findData();
