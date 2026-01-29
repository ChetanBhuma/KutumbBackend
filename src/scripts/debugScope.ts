import { prisma } from '../config/database';

async function checkSHOScope() {
    try {
        console.log("Checking Role Configuration for 'SHO'...");
        const shoRole = await prisma.role.findFirst({
            where: {
                OR: [
                    { code: 'SHO' },
                    { name: 'Station House Officer' } // adjust based on actual data
                ]
            }
        });
        console.log("SHO Role Config:", shoRole);

        if (!shoRole) {
            console.error("SHO Role not found!");
            return;
        }

        console.log("\nFinding a user with role 'SHO'...");
        const shoUser = await prisma.user.findFirst({
            where: { role: shoRole.code },
            include: {
                BeatOfficer: true
            }
        });
        console.log("SHO User Found:", shoUser?.email);

        if (shoUser && shoUser.BeatOfficer) {
            console.log("Linked Officer Profile:", {
                id: shoUser.BeatOfficer.id,
                policeStationId: shoUser.BeatOfficer.policeStationId,
                districtId: shoUser.BeatOfficer.districtId,
                rank: shoUser.BeatOfficer.rank
            });

            console.log("\nChecking 'dataScopeMiddleware' logic simulation:");
            const jurisdictionLevel = shoRole.jurisdictionLevel;
            console.log(`Jurisdiction Level from DB: ${jurisdictionLevel}`);

            let scopeQuery = {};
            if (jurisdictionLevel === 'POLICE_STATION') {
                scopeQuery = { policeStationId: shoUser.BeatOfficer.policeStationId };
            } else if (jurisdictionLevel === 'ALL') {
                scopeQuery = "ALL ACCESS";
            }

            console.log("Simulated Scope Query:", scopeQuery);
        } else {
            console.log("No SHO user with linked officer profile found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSHOScope();
