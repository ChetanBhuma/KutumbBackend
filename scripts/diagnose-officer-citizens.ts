import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseOfficerCitizens() {
    const badgeNumber = 'BADGE-PS_UTTAM_NAGAR-CONST-4-1769493582353';

    console.log('='.repeat(80));
    console.log('OFFICER & CITIZEN DIAGNOSIS');
    console.log('='.repeat(80));

    // 1. Get officer details
    const officer = await prisma.beatOfficer.findUnique({
        where: { badgeNumber },
        include: {
            PoliceStation: { select: { id: true, name: true } },
            Beat: { select: { id: true, name: true } },
            user: { select: { id: true, email: true, role: true } }
        }
    });

    if (!officer) {
        console.log('❌ Officer not found!');
        return;
    }

    console.log('\n📋 OFFICER DETAILS:');
    console.log('  ID:', officer.id);
    console.log('  Name:', officer.name);
    console.log('  Badge:', officer.badgeNumber);
    console.log('  Beat ID:', officer.beatId);
    console.log('  Beat Name:', officer.Beat?.name || 'NULL');
    console.log('  Police Station ID:', officer.policeStationId);
    console.log('  Police Station Name:', officer.PoliceStation?.name || 'NULL');
    console.log('  User ID:', officer.user?.id);
    console.log('  User Role:', officer.user?.role);

    // 2. Check scope filter logic
    console.log('\n🔍 SCOPE FILTER LOGIC:');
    let scopeFilter: any = {};
    if (officer.beatId) {
        scopeFilter = { beatId: officer.beatId };
        console.log('  Using BEAT filter:', scopeFilter);
    } else if (officer.policeStationId) {
        scopeFilter = { policeStationId: officer.policeStationId };
        console.log('  Using POLICE STATION filter:', scopeFilter);
    } else {
        console.log('  No filter (will show ALL citizens)');
    }

    // 3. Count citizens with this filter
    const citizenCount = await prisma.seniorCitizen.count({
        where: {
            ...scopeFilter,
            isActive: true
        }
    });

    console.log('\n👥 CITIZENS IN SCOPE:');
    console.log('  Total Active Citizens:', citizenCount);

    // 4. Get sample citizens
    const citizens = await prisma.seniorCitizen.findMany({
        where: {
            ...scopeFilter,
            isActive: true
        },
        take: 5,
        select: {
            id: true,
            fullName: true,
            beatId: true,
            policeStationId: true,
            Beat: { select: { name: true } },
            PoliceStation: { select: { name: true } }
        }
    });

    if (citizens.length > 0) {
        console.log('\n  Sample Citizens:');
        citizens.forEach((c, i) => {
            console.log(`    ${i + 1}. ${c.fullName}`);
            console.log(`       Beat: ${c.Beat?.name || 'NULL'} (ID: ${c.beatId})`);
            console.log(`       PS: ${c.PoliceStation?.name || 'NULL'} (ID: ${c.policeStationId})`);
        });
    } else {
        console.log('  ❌ No citizens found with this filter!');
    }

    // 5. Check if there are citizens in the same police station but different beat
    if (officer.policeStationId) {
        const psCount = await prisma.seniorCitizen.count({
            where: {
                policeStationId: officer.policeStationId,
                isActive: true
            }
        });

        console.log('\n📊 POLICE STATION COMPARISON:');
        console.log(`  Total citizens in ${officer.PoliceStation?.name}:`, psCount);
        console.log(`  Citizens in officer's beat:`, citizenCount);
        console.log(`  Difference:`, psCount - citizenCount);
    }

    // 6. Check visits
    const visits = await prisma.visit.findMany({
        where: {
            officerId: officer.id,
            status: 'SCHEDULED'
        },
        include: {
            SeniorCitizen: {
                select: {
                    id: true,
                    fullName: true,
                    beatId: true,
                    policeStationId: true
                }
            }
        },
        take: 5
    });

    console.log('\n📅 SCHEDULED VISITS:');
    console.log('  Total:', visits.length);
    if (visits.length > 0) {
        visits.forEach((v, i) => {
            console.log(`    ${i + 1}. ${v.SeniorCitizen?.fullName || 'Unknown'}`);
            console.log(`       Citizen Beat ID: ${v.SeniorCitizen?.beatId}`);
            console.log(`       Citizen PS ID: ${v.SeniorCitizen?.policeStationId}`);
            console.log(`       Matches Officer Beat: ${v.SeniorCitizen?.beatId === officer.beatId ? '✅' : '❌'}`);
        });
    }

    console.log('\n' + '='.repeat(80));

    await prisma.$disconnect();
}

diagnoseOfficerCitizens().catch(console.error);
