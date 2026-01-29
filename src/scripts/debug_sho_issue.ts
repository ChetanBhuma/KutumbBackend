
import { prisma } from '../config/database';

const TARGET_EMAIL = 'shouttamnagar@gmail.com';

async function debugUserScope() {
    console.log(`--- Debugging User: ${TARGET_EMAIL} ---`);

    // 1. Fetch User and Relations
    const user = await prisma.user.findUnique({
        where: { email: TARGET_EMAIL },
        include: {
            officerProfile: {
                include: {
                    PoliceStation: true
                }
            }
        }
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log('User Record:', {
        id: user.id,
        email: user.email,
        role: user.role,
        officerId: user.officerId
    });

    // 2. Check Role Configuration
    const roleCode = user.role;
    const roleConfig = await prisma.role.findUnique({
        where: { code: roleCode }
    });

    if (!roleConfig) {
        console.error(`❌ Role configuration for code '${roleCode}' NOT FOUND in Role table.`);
    } else {
        console.log('Role Configuration:', {
            code: roleConfig.code,
            jurisdictionLevel: roleConfig.jurisdictionLevel
        });
    }

    // 3. Check Officer Profile
    if (!user.officerProfile) {
        console.error('❌ User has NO mapped officer profile.');
    } else {
        console.log('Officer Profile:', {
            id: user.officerProfile.id,
            name: user.officerProfile.name,
            policeStationId: user.officerProfile.policeStationId,
            policeStationName: user.officerProfile.PoliceStation?.name
        });
    }

    // 4. Simulate Data Scope Logic (replicating Middleware)
    console.log('\n--- Scope Simulation ---');
    if (roleConfig && user.officerProfile) {
        const level = roleConfig.jurisdictionLevel;
        let scope: any = { level, jurisdictionIds: {} };

        if (level === 'POLICE_STATION') {
            scope.jurisdictionIds.policeStationId = user.officerProfile.policeStationId;
        }

        console.log('Simulated Scope Object:', JSON.stringify(scope, null, 2));

        if (level === 'POLICE_STATION' && !scope.jurisdictionIds.policeStationId) {
             console.log('⚠️ RISK: Restricted level but missing ID. (Should be handled by Fail-Closed logic)');
        } else if (level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
             console.log('✅ OK: Scope is correctly constructed for Police Station level.');
        }
    }
}

debugUserScope().catch(console.error).finally(() => prisma.$disconnect());
