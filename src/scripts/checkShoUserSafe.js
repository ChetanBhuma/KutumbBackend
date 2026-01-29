const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Looking for SHO user matches...");

        // 1. Find the Role
        const role = await prisma.role.findFirst({
            where: {
                OR: [{ code: 'SHO' }, { name: 'Station House Officer' }]
            }
        });
        console.log("SHO Role found:", role ? role.code : "NONE");

        if (!role) return;

        // 2. Find Users with this role
        const users = await prisma.user.findMany({
            where: { role: role.code },
            include: { BeatOfficer: true },
            take: 3
        });

        console.log(`Found ${users.length} users with role ${role.code}`);

        users.forEach((u, i) => {
            console.log(`\n--- User ${i+1} ---`);
            console.log("Email:", u.email);
            console.log("Officer ID:", u.officerId);

            if (u.BeatOfficer) {
                console.log("Linked Officer Profile:", {
                    id: u.BeatOfficer.id,
                    name: u.BeatOfficer.name,
                    stationId: u.BeatOfficer.policeStationId,
                });
            } else {
                console.log("WARNING: No Linked Officer Profile!");
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
