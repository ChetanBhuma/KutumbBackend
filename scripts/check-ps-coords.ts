import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPoliceStations() {
    const total = await prisma.policeStation.count({
        where: { isActive: true }
    });

    const withCoords = await prisma.policeStation.count({
        where: {
            isActive: true,
            latitude: { not: null },
            longitude: { not: null }
        }
    });

    console.log('📊 Police Station Statistics:');
    console.log(`   Total active PS: ${total}`);
    console.log(`   With coordinates: ${withCoords}`);
    console.log(`   Without coordinates: ${total - withCoords}`);

    // Show some examples of PS without coordinates
    const withoutCoords = await prisma.policeStation.findMany({
        where: {
            isActive: true,
            OR: [
                { latitude: null },
                { longitude: null }
            ]
        },
        select: { name: true, code: true },
        take: 10
    });

    if (withoutCoords.length > 0) {
        console.log('\n⚠️  Examples of PS without coordinates:');
        withoutCoords.forEach(ps => console.log(`   - ${ps.name} (${ps.code})`));
    }

    await prisma.$disconnect();
}

checkPoliceStations().catch(console.error);
