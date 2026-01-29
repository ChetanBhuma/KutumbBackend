
import { prisma } from '../config/database';

async function listSHOs() {
    console.log(`--- Listing All SHO Users ---`);

    const shos = await prisma.user.findMany({
        where: { role: 'SHO' }, // Ensure role code matches exactly, or use contains
        include: {
            officerProfile: { include: { PoliceStation: true } }
        }
    });

    console.log(`Found ${shos.length} SHO users.`);

    for (const user of shos) {
        console.log(`\nEmail: ${user.email}`);
        console.log(`Officer: ${user.officerProfile?.name || 'N/A'}`);
        console.log(`Station: ${user.officerProfile?.PoliceStation?.name || 'N/A'}`);
    }
}

listSHOs().catch(console.error).finally(() => prisma.$disconnect());
