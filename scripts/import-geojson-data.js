/**
 * GeoJSON Import Script
 *
 * This script imports all jurisdiction data from GeoJSON files:
 * - 7 Ranges
 * - 16 Districts
 * - 67 Sub-Divisions
 * - 224 Police Stations
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper function to generate code from name
function generateCode(name) {
    return name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// Helper function to normalize range names
function normalizeRangeName(range) {
    const mapping = {
        'CENTRAL': 'CENTRAL',
        'EASTERN': 'EASTERN',
        'WESTERN': 'WESTERN',
        'NORTHERN': 'NORTHERN',
        'SOUTHERN': 'SOUTHERN',
        'NEW DELHI': 'NEW_DELHI',
        'AIRPORT': 'AIRPORT',
        'CENT': 'CENTRAL',
        'EAST': 'EASTERN',
        'WEST': 'WESTERN',
        'NORTH': 'NORTHERN',
        'SOUTH': 'SOUTHERN',
    };

    return mapping[range.toUpperCase()] || range.toUpperCase().replace(/\s+/g, '_');
}

async function importRanges() {
    console.log('\n📍 Importing Ranges...');

    const geoJsonPath = path.join(__dirname, '../jsongeo/Range Boundary.geojson');
    const data = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

    const rangeMap = new Map();
    let created = 0;
    let skipped = 0;

    for (const feature of data.features) {
        const rangeName = feature.properties.RANGE;
        const code = normalizeRangeName(rangeName);

        try {
            const existing = await prisma.range.findUnique({
                where: { code },
            });

            if (existing) {
                rangeMap.set(rangeName, existing.id);
                skipped++;
                continue;
            }

            const range = await prisma.range.create({
                data: {
                    code,
                    name: rangeName,
                    isActive: true,
                },
            });

            rangeMap.set(rangeName, range.id);
            created++;
            console.log(`  ✓ Created: ${rangeName} (${code})`);
        } catch (error) {
            console.error(`  ✗ Error creating range ${rangeName}:`, error.message);
        }
    }

    console.log(`✅ Ranges: ${created} created, ${skipped} skipped`);
    return rangeMap;
}

async function importDistricts(rangeMap) {
    console.log('\n🗺️  Importing Districts...');

    const geoJsonPath = path.join(__dirname, '../jsongeo/District Boundary.geojson');
    const data = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

    const districtMap = new Map();
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const feature of data.features) {
        const districtName = feature.properties.DISTRICT;
        const rangeName = feature.properties.RANGE;
        const area = feature.properties.AREA__SQKM || feature.properties.AREA;

        const code = generateCode(districtName);
        const rangeCode = normalizeRangeName(rangeName);

        try {
            const range = await prisma.range.findUnique({
                where: { code: rangeCode },
            });

            if (!range) {
                console.error(`  ✗ Range not found: ${rangeName} (${rangeCode})`);
                errors++;
                continue;
            }

            const existing = await prisma.district.findUnique({
                where: { code },
            });

            if (existing) {
                districtMap.set(districtName, existing.id);
                skipped++;
                continue;
            }

            const district = await prisma.district.create({
                data: {
                    code,
                    name: districtName,
                    rangeId: range.id,
                    area: area ? area.toString() : '',
                    population: 0,
                    headquarters: districtName,
                    isActive: true,
                },
            });

            districtMap.set(districtName, district.id);
            created++;
            console.log(`  ✓ Created: ${districtName} → ${rangeName}`);
        } catch (error) {
            console.error(`  ✗ Error creating district ${districtName}:`, error.message);
            errors++;
        }
    }

    console.log(`✅ Districts: ${created} created, ${skipped} skipped, ${errors} errors`);
    return districtMap;
}

async function importSubDivisions(districtMap, rangeMap) {
    console.log('\n🏘️  Importing Sub-Divisions...');

    const geoJsonPath = path.join(__dirname, '../jsongeo/Sub Division Boundary.geojson');
    const data = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

    const subDivMap = new Map();
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const feature of data.features) {
        const subDivName = feature.properties.SUB_DIVISI || feature.properties.SUBDIVISION;
        const districtName = feature.properties.DISTRICT;

        if (!subDivName) {
            errors++;
            continue;
        }

        const code = generateCode(subDivName);

        try {
            const district = await prisma.district.findFirst({
                where: {
                    name: {
                        equals: districtName,
                        mode: 'insensitive',
                    },
                },
            });

            if (!district) {
                console.error(`  ✗ District not found: ${districtName}`);
                errors++;
                continue;
            }

            const existing = await prisma.subDivision.findUnique({
                where: { code },
            });

            if (existing) {
                subDivMap.set(subDivName, existing.id);
                skipped++;
                continue;
            }

            const subDiv = await prisma.subDivision.create({
                data: {
                    code,
                    name: subDivName,
                    districtId: district.id,
                    area: '',
                    population: 0,
                    headquarters: subDivName,
                    isActive: true,
                },
            });

            subDivMap.set(subDivName, subDiv.id);
            created++;
            console.log(`  ✓ Created: ${subDivName} → ${districtName}`);
        } catch (error) {
            console.error(`  ✗ Error creating sub-division ${subDivName}:`, error.message);
            errors++;
        }
    }

    console.log(`✅ Sub-Divisions: ${created} created, ${skipped} skipped, ${errors} errors`);
    return subDivMap;
}

async function importPoliceStations(subDivMap) {
    console.log('\n🚔 Importing Police Stations...');

    const geoJsonPath = path.join(__dirname, '../jsongeo/Police Station Boundary.geojson');
    const data = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const feature of data.features) {
        const psName = feature.properties.POL_STN_NM || feature.properties.PS_NAME || feature.properties.NAME;
        const subDivName = feature.properties.SUB_DIVISI || feature.properties.SUBDIVISION;

        if (!psName) {
            errors++;
            continue;
        }

        const code = generateCode(psName);

        try {
            const subDiv = await prisma.subDivision.findFirst({
                where: {
                    name: {
                        equals: subDivName,
                        mode: 'insensitive',
                    },
                },
                include: {
                    District: true,
                },
            });

            if (!subDiv) {
                console.error(`  ✗ Sub-division not found: ${subDivName}`);
                errors++;
                continue;
            }

            const existing = await prisma.policeStation.findUnique({
                where: { code },
            });

            if (existing) {
                skipped++;
                continue;
            }

            const ps = await prisma.policeStation.create({
                data: {
                    code,
                    name: psName,
                    address: psName, // Use PS name as default address
                    rangeId: subDiv.District.rangeId,
                    districtId: subDiv.districtId,
                    subDivisionId: subDiv.id,
                    isActive: true,
                },
            });

            created++;
            if (created % 20 === 0) {
                console.log(`  ... ${created} police stations created`);
            }
        } catch (error) {
            console.error(`  ✗ Error creating PS ${psName}:`, error.message);
            errors++;
        }
    }

    console.log(`✅ Police Stations: ${created} created, ${skipped} skipped, ${errors} errors`);
}

async function main() {
    console.log('🚀 Starting GeoJSON Import...\n');
    console.log('This will import:');
    console.log('  - 7 Ranges');
    console.log('  - 16 Districts');
    console.log('  - 67 Sub-Divisions');
    console.log('  - 224 Police Stations');
    console.log('');

    try {
        const rangeMap = await importRanges();
        const districtMap = await importDistricts(rangeMap);
        const subDivMap = await importSubDivisions(districtMap, rangeMap);
        await importPoliceStations(subDivMap);

        console.log('\n✅ GeoJSON Import Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log(`  Ranges: ${rangeMap.size}`);
        console.log(`  Districts: ${districtMap.size}`);
        console.log(`  Sub-Divisions: ${subDivMap.size}`);

    } catch (error) {
        console.error('\n❌ Import failed:', error);
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
