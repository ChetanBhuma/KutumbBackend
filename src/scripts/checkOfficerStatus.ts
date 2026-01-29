import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const total = await prisma.beatOfficer.count();
        const unassigned = await prisma.beatOfficer.count({ where: { beatId: null } });
        const assigned = await prisma.beatOfficer.count({ where: { beatId: { not: null } } });

        console.log(`Total Officers: ${total}`);
        console.log(`Unassigned (beatId is null): ${unassigned}`);
        console.log(`Assigned (beatId is NOT null): ${assigned}`);

        if (assigned > 0) {
            const sample = await prisma.beatOfficer.findFirst({
                where: { beatId: { not: null } },
                select: { name: true, beatId: true, Beat: { select: { name: true } } }
            });
            console.log(`Sample assigned officer: ${sample?.name} -> Beat: ${sample?.Beat?.name} (${sample?.beatId})`);
        } else {
            console.log('No officers are currently assigned to any beat.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
