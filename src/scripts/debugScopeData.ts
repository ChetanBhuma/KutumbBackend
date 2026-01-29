
import { prisma } from '../config/database';

async function debugDataScope() {
    console.log('--- Debugging Data Scope (Corrected) ---');

    // 1. Find PS UTTAM NAGAR
    const stations = await prisma.policeStation.findMany({
        where: { name: { contains: 'UTTAM NAGAR', mode: 'insensitive' } }
    });
    console.log('Found Stations:', stations.map(s => `${s.name} (${s.id})`));

    if (stations.length === 0) {
        console.error('No PS UTTAM NAGAR found');
        return;
    }

    const stationId = stations[0].id;

    // 2. Find Officers linked to this station
    // Note: User -> Officer relation is defined on User side as officerId, or Officer side as user?
    // Officer model has 'user User?'
    const officers = await prisma.beatOfficer.findMany({
        where: { policeStationId: stationId },
        include: { user: true } // Correct relation name is lowercase 'user'
    });
    console.log(`Found ${officers.length} officers in this station.`);

    // 3. Inspect officers
    for (const officer of officers) {
        if (officer.user) {
            console.log(`\nChecking Officer: ${officer.name} (${officer.id})`);
            console.log(`User ID: ${officer.user.id}`);
            console.log(`User Role Code: ${officer.user.role}`);

            // Fetch Role Config manually
            const roleConfig = await prisma.role.findUnique({
                where: { code: officer.user.role }
            });

            if (roleConfig) {
                console.log(`Role Jurisdiction Level: ${roleConfig.jurisdictionLevel}`);

                if (roleConfig.jurisdictionLevel === 'POLICE_STATION') {
                    console.log('✅ Role has correct POLICE_STATION level');

                    if (officer.policeStationId === stationId) {
                        console.log('✅ Officer has correct policeStationId');
                    } else {
                        console.error(`❌ Officer has mismatching policeStationId: ${officer.policeStationId} (Expected: ${stationId})`);
                    }
                } else if (roleConfig.jurisdictionLevel === 'ALL' || roleConfig.jurisdictionLevel === 'STATE') {
                     // If it's ALL, then seeing all beats is EXPECTED behavior, not a bug.
                     console.log('⚠️ Officer has ALL/STATE access. Seeing all beats is EXPECTED.');
                } else {
                     console.log(`⚠️ Officer has level: ${roleConfig.jurisdictionLevel}`);
                }
            } else {
                console.error(`❌ Role config for '${officer.user.role}' not found in DB!`);
            }
        }
    }
}

debugDataScope().catch(console.error).finally(() => prisma.$disconnect());
