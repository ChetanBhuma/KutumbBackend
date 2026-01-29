import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const ranges = await prisma.range.findMany();
    console.log('Range Count:', ranges.length);
    if (ranges.length > 0) {
        console.log('Sample Range:', ranges[0]);
    }
    const districts = await prisma.district.findMany();
    console.log('District Count:', districts.length);

    const subs = await prisma.subDivision.findMany();
    console.log('SubDivision Count:', subs.length);

    const stations = await prisma.policeStation.findMany();
    console.log('Station Count:', stations.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
