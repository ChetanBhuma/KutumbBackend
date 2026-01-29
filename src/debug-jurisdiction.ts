
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simulation of "UTTAM NAGAR" PS context
// PS ID: cmkgp04qq008dby7om11f3uvv
const PS_ID = 'cmkgp04qq008dby7om11f3uvv';

async function verifyJurisdictionLogic() {
  try {
    console.log(`--- Verifying Jurisdiction for PS: UTTAM NAGAR (${PS_ID}) ---`);

    // 1. Simulate CitizenController.list
    // It filters by policeStationId when dataScope is POLICE_STATION
    const citizensCount = await prisma.seniorCitizen.count({
        where: {
            policeStationId: PS_ID,
            isActive: true
        }
    });
    console.log(`[Citizens] Count in jurisdiction: ${citizensCount}`);

    // 2. Simulate OfficerController.list (Standard)
    // It filters by policeStationId when dataScope is POLICE_STATION
    const allOfficersCount = await prisma.beatOfficer.count({
        where: {
            policeStationId: PS_ID,
            isActive: true
        }
    });
    console.log(`[Officers] Total active in jurisdiction: ${allOfficersCount}`);

    // 3. Simulate OfficerController.list (With hasBeat filter)
    // This uses the new logic: where.beatId = { not: null }
    const mappedOfficersCount = await prisma.beatOfficer.count({
        where: {
            policeStationId: PS_ID,
            isActive: true,
            beatId: { not: null }
        }
    });
    console.log(`[Officers] Mapped to beat (hasBeat=true): ${mappedOfficersCount}`);

    // Validation
    if (citizensCount === 6) console.log('✅ Citizen count matches expectation (6)');
    else console.log('❌ Citizen count mismatch');

    if (allOfficersCount === 8) console.log('✅ Total Officer count matches expectation (8)');
    else console.log('❌ Total Officer count mismatch');

    if (mappedOfficersCount === 3) console.log('✅ Mapped Officer count matches expectation (3)');
    else console.log('❌ Mapped Officer count mismatch');

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyJurisdictionLogic();
