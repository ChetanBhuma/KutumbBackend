/**
 * Migration Script: Populate Jurisdiction Hierarchy
 *
 * This script:
 * 1. Creates 7 Range records
 * 2. Updates existing Districts to link to Ranges via rangeId
 * 3. Updates existing PoliceStations to include all hierarchical FKs
 * 4. Updates existing Beats to include all hierarchical FKs
 *
 * Run this AFTER the Prisma migration has been applied
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Delhi Police Ranges
const RANGES = [
    { code: 'CENTRAL', name: 'Central Range' },
    { code: 'NORTHERN', name: 'Northern Range' },
    { code: 'SOUTHERN', name: 'Southern Range' },
    { code: 'EASTERN', name: 'Eastern Range' },
    { code: 'WESTERN', name: 'Western Range' },
    { code: 'NEW_DELHI', name: 'New Delhi Range' },
    { code: 'AIRPORT', name: 'Airport Range' },
];

// Mapping of range names (old string values) to range codes
const RANGE_NAME_TO_CODE_MAP: Record<string, string> = {
    'NORTH': 'NORTHERN',
    'SOUTH': 'SOUTHERN',
    'EAST': 'EASTERN',
    'WEST': 'WESTERN',
    'CENTRAL': 'CENTRAL',
    'OUTER': 'WESTERN', // Map OUTER to WESTERN
    'NEW DELHI': 'NEW_DELHI',
};

async function main() {
    console.log('🚀 Starting jurisdiction hierarchy migration...\n');

    try {
        // Step 1: Create Ranges
        console.log('Step 1: Creating Ranges...');
        const rangeMap = new Map<string, string>(); // code -> id

        for (const range of RANGES) {
            const existing = await prisma.range.findUnique({
                where: { code: range.code },
            });

            if (existing) {
                console.log(`  ✓ Range "${range.name}" already exists`);
                rangeMap.set(range.code, existing.id);
            } else {
                const created = await prisma.range.create({
                    data: range,
                });
                rangeMap.set(range.code, created.id);
                console.log(`  ✓ Created Range: ${range.name} (${range.code})`);
            }
        }
        console.log(`✅ Ranges created: ${rangeMap.size}\n`);

        // Step 2: Update Districts with rangeId
        console.log('Step 2: Updating Districts with rangeId...');
        const districts = await prisma.district.findMany();
        let districtUpdated = 0;
        let districtSkipped = 0;

        for (const district of districts) {
            // Skip if already has rangeId
            if (district.rangeId) {
                districtSkipped++;
                continue;
            }

            // Get range code from old range field
            const oldRange = district.range;
            if (!oldRange) {
                console.log(`  ⚠️  District "${district.name}" has no range value, skipping`);
                continue;
            }

            const rangeCode = RANGE_NAME_TO_CODE_MAP[oldRange.toUpperCase()];
            if (!rangeCode) {
                console.log(`  ⚠️  Unknown range "${oldRange}" for district "${district.name}", skipping`);
                continue;
            }

            const rangeId = rangeMap.get(rangeCode);
            if (!rangeId) {
                console.log(`  ⚠️  Range ID not found for code "${rangeCode}", skipping`);
                continue;
            }

            await prisma.district.update({
                where: { id: district.id },
                data: { rangeId },
            });

            districtUpdated++;
            console.log(`  ✓ Updated District: ${district.name} → ${rangeCode}`);
        }
        console.log(`✅ Districts updated: ${districtUpdated}, skipped: ${districtSkipped}\n`);

        // Step 3: Update PoliceStations with hierarchical FKs
        console.log('Step 3: Updating PoliceStations with hierarchical FKs...');
        const policeStations = await prisma.policeStation.findMany({
            include: {
                SubDivision: {
                    include: {
                        District: {
                            include: {
                                Range: true,
                            },
                        },
                    },
                },
            },
        });

        let psUpdated = 0;
        let psSkipped = 0;

        for (const ps of policeStations) {
            // Skip if already has all required FKs
            if (ps.rangeId && ps.districtId && ps.subDivisionId) {
                psSkipped++;
                continue;
            }

            // Get hierarchical IDs from SubDivision
            if (!ps.SubDivision) {
                console.log(`  ⚠️  PoliceStation "${ps.name}" has no SubDivision, skipping`);
                continue;
            }

            const subDivisionId = ps.SubDivision.id;
            const districtId = ps.SubDivision.District.id;
            const rangeId = ps.SubDivision.District.Range?.id;

            if (!rangeId) {
                console.log(`  ⚠️  PoliceStation "${ps.name}" has no Range via District, skipping`);
                continue;
            }

            await prisma.policeStation.update({
                where: { id: ps.id },
                data: {
                    rangeId,
                    districtId,
                    subDivisionId,
                },
            });

            psUpdated++;
            console.log(`  ✓ Updated PoliceStation: ${ps.name}`);
        }
        console.log(`✅ PoliceStations updated: ${psUpdated}, skipped: ${psSkipped}\n`);

        // Step 4: Update Beats with hierarchical FKs
        console.log('Step 4: Updating Beats with hierarchical FKs...');
        const beats = await prisma.beat.findMany({
            include: {
                PoliceStation: {
                    include: {
                        SubDivision: {
                            include: {
                                District: {
                                    include: {
                                        Range: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        let beatUpdated = 0;
        let beatSkipped = 0;

        for (const beat of beats) {
            // Skip if already has all hierarchical FKs
            if (beat.rangeId && beat.districtId && beat.subDivisionId) {
                beatSkipped++;
                continue;
            }

            // Get hierarchical IDs from PoliceStation
            const ps = beat.PoliceStation;
            if (!ps.SubDivision) {
                console.log(`  ⚠️  Beat "${beat.name}" has no SubDivision via PoliceStation, skipping`);
                continue;
            }

            const subDivisionId = ps.SubDivision.id;
            const districtId = ps.SubDivision.District.id;
            const rangeId = ps.SubDivision.District.Range?.id;

            if (!rangeId) {
                console.log(`  ⚠️  Beat "${beat.name}" has no Range, skipping`);
                continue;
            }

            await prisma.beat.update({
                where: { id: beat.id },
                data: {
                    rangeId,
                    districtId,
                    subDivisionId,
                },
            });

            beatUpdated++;
            console.log(`  ✓ Updated Beat: ${beat.name}`);
        }
        console.log(`✅ Beats updated: ${beatUpdated}, skipped: ${beatSkipped}\n`);

        // Summary
        console.log('📊 Migration Summary:');
        console.log(`  Ranges created: ${rangeMap.size}`);
        console.log(`  Districts updated: ${districtUpdated}`);
        console.log(`  PoliceStations updated: ${psUpdated}`);
        console.log(`  Beats updated: ${beatUpdated}`);
        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
