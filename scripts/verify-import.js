const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    const ranges = await prisma.range.count();
    const districts = await prisma.district.count();
    const subDivs = await prisma.subDivision.count();
    const ps = await prisma.policeStation.count();

    console.log('\n📊 Database Counts:');
    console.log(`  Ranges: ${ranges}`);
    console.log(`  Districts: ${districts}`);
    console.log(`  Sub-Divisions: ${subDivs}`);
    console.log(`  Police Stations: ${ps}`);

    console.log('\n📍 Ranges:');
    const rangeList = await prisma.range.findMany({
        include: {
            _count: {
                select: {
                    District: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });
    rangeList.forEach(r => {
        console.log(`  - ${r.name} (${r.code}): ${r._count.District} districts`);
    });

    await prisma.$disconnect();
}

verify().catch(console.error);
