import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkShoUser() {
    try {
        console.log("Searching for a user with role 'SHO'...");
        const user = await prisma.user.findFirst({
            where: { role: 'SHO' },
            include: { BeatOfficer: true }
        });

        if (!user) {
            console.log("No SHO user found.");
            return;
        }

        console.log("User Found:", {
            email: user.email,
            role: user.role,
            officerId: user.officerId
        });

        if (user.BeatOfficer) {
            console.log("Linked Officer Profile:", {
                id: user.BeatOfficer.id,
                name: user.BeatOfficer.name,
                policeStationId: user.BeatOfficer.policeStationId
            });

            if (!user.BeatOfficer.policeStationId) {
                console.error("CRITICAL: Officer profile is missing `policeStationId`!");
            }
        } else {
            console.error("CRITICAL: User has 'SHO' role but NO linked BeatOfficer profile.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkShoUser();
