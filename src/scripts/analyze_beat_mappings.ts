
import { prisma } from '../config/database';

async function analyzeBeatMappings() {
    console.log('--- Deep Analysis of Beat Mappings ---');

    // 1. Fetch All Beats with relations
    const beats = await prisma.beat.findMany({
        include: {
            PoliceStation: {
                select: { id: true, name: true, districtId: true, subDivisionId: true }
            }
        }
    });

    console.log(`Total Beats Found: ${beats.length}`);

    let anomalies = 0;
    const stationStats: Record<string, number> = {};

    console.log('\n--- Checking Constraints ---');

    for (const beat of beats) {
        // Check for Orphans
        if (!beat.PoliceStation) {
            console.error(`❌ ORPHAN ALERT: Beat '${beat.name}' (${beat.id}) has NO valid Police Station linked (ID: ${beat.policeStationId})`);
            anomalies++;
            continue;
        }

        // Aggregate Stats
        const stationName = beat.PoliceStation.name;
        stationStats[stationName] = (stationStats[stationName] || 0) + 1;

        // Check Hierarchy Consistency (Optional but recommended)
        // If Beat stores districtId, it should match Station's districtId
        if (beat.districtId && beat.districtId !== beat.PoliceStation.districtId) {
             console.warn(`⚠️ HIERARCHY MISMATCH: Beat '${beat.name}' District (${beat.districtId}) != Station '${stationName}' District (${beat.PoliceStation.districtId})`);
             anomalies++;
        }
    }

    console.log('\n--- Summary Report ---');
    if (anomalies === 0) {
        console.log('✅ INTEGRETY CHECK PASSED: All beats are correctly mapped to valid Police Stations.');
    } else {
        console.error(`❌ FOUND ${anomalies} DATA ANOMALIES.`);
    }

    console.log('\n--- Beat Distribution per Station ---');
    console.table(stationStats);
}

analyzeBeatMappings().catch(console.error).finally(() => prisma.$disconnect());
