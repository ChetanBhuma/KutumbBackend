import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listUsers() {
    try {
        console.log("Listing users with officer profiles...");
        const users = await prisma.user.findMany({
            take: 20,
            where: {
                role: {
                    in: ['SHO', 'AreConstable', 'CONSTABLE', 'SUPER_ADMIN', 'ADMIN'] // Try to match likely roles
                }
            },
            include: {
                officerProfile: true
            }
        });

        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log("------------------------------------------------");
            console.log(`Email: ${user.email}`);
            console.log(`Role:  ${user.role}`);
            if (user.officerProfile) {
                console.log(`Officer: ${user.officerProfile.name} (${user.officerProfile.rank})`);
                console.log(`StationID: ${user.officerProfile.policeStationId}`);
                console.log(`BeatID:    ${user.officerProfile.beatId}`);
            } else {
                console.log("No linked Officer profile.");
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
