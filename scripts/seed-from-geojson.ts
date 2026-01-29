/**
 * GeoJSON Seed Script - Safe Version
 *
 * This script seeds Range, District, Sub-Division, and Police Station data
 * from GeoJSON files without impacting existing data.
 *
 * USAGE:
 *   cd backend
 *   npm run seed:geojson
 *
 * WHAT IT DOES:
 * 1. Reads GeoJSON files from jsongeo/ directory
 * 2. Uses UPSERT to create or update records (no data loss)
 * 3. Maintains relationships between Range -> District -> Sub-Division -> Police Station
 * 4. Adds latitude/longitude coordinates to Police Stations
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting GeoJSON seed process...\n');

    try {
        // Step 1: Seed Ranges
        console.log('📍 Step 1/4: Seeding Ranges...');
        const rangeMap = await seedRanges();
        console.log(`✅ Completed: ${rangeMap.size} ranges\n`);

        // Step 2: Seed Districts
        console.log('📍 Step 2/4: Seeding Districts...');
        const districtMap = await seedDistricts(rangeMap);
        console.log(`✅ Completed: ${districtMap.size} districts\n`);

        // Step 3: Seed Sub-Divisions
        console.log('📍 Step 3/4: Seeding Sub-Divisions...');
        const subDivMap = await seedSubDivisions(districtMap);
        console.log(`✅ Completed: ${subDivMap.size} sub-divisions\n`);

        // Step 4: Seed Police Stations
        console.log('📍 Step 4/4: Seeding Police Stations...');
        const psStats = await seedPoliceStations(rangeMap, districtMap, subDivMap);
        console.log(`✅ Completed: ${psStats.created} created, ${psStats.updated} updated\n`);

        // Summary
        console.log('\n📊 ========================================');
        console.log('📊 SEED SUMMARY');
        console.log('📊 ========================================');
        console.log(`✅ Ranges: ${rangeMap.size}`);
        console.log(`✅ Districts: ${districtMap.size}`);
        console.log(`✅ Sub-Divisions: ${subDivMap.size}`);
        console.log(`✅ Police Stations: ${psStats.created} created, ${psStats.updated} updated`);
        console.log('📊 ========================================\n');
        console.log('🎉 GeoJSON seed completed successfully!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function seedRanges(): Promise<Map<string, string>> {
    const filePath = path.join(__dirname, '../jsongeo/Range Boundary.geojson');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const rangeMap = new Map<string, string>();

    for (const feature of data.features) {
        const rangeName = feature.properties?.RANGE?.trim() || feature.properties?.NAME?.trim();
        if (!rangeName) continue;

        const code = rangeName.replace(/\s+/g, '_').toUpperCase();

        const range = await prisma.range.upsert({
            where: { code },
            update: { name: rangeName, isActive: true },
            create: { code, name: rangeName, isActive: true }
        });

        rangeMap.set(rangeName.toUpperCase(), range.id);
        console.log(`  ✅ ${rangeName}`);
    }

    return rangeMap;
}

async function seedDistricts(rangeMap: Map<string, string>): Promise<Map<string, string>> {
    const filePath = path.join(__dirname, '../jsongeo/District Boundary.geojson');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const districtMap = new Map<string, string>();

    for (const feature of data.features) {
        const districtName = feature.properties?.DISTRICT?.trim() || feature.properties?.DIST_NM?.trim();
        const rangeName = feature.properties?.RANGE?.trim();

        if (!districtName) continue;

        const code = districtName.replace(/\s+/g, '_').toUpperCase();
        const rangeId = rangeName ? rangeMap.get(rangeName.toUpperCase()) : undefined;

        const district = await prisma.district.upsert({
            where: { code },
            update: {
                name: districtName,
                rangeId: rangeId,
                range: rangeName || districtName,
                area: String(feature.properties?.AREA__SQKM || 0),
                headquarters: districtName,
                isActive: true
            },
            create: {
                code,
                name: districtName,
                rangeId: rangeId,
                range: rangeName || districtName,
                area: String(feature.properties?.AREA__SQKM || 0),
                headquarters: districtName,
                population: 0,
                isActive: true
            }
        });

        districtMap.set(districtName.toUpperCase(), district.id);
        console.log(`  ✅ ${districtName} (Range: ${rangeName || 'N/A'})`);
    }

    return districtMap;
}

async function seedSubDivisions(districtMap: Map<string, string>): Promise<Map<string, string>> {
    const filePath = path.join(__dirname, '../jsongeo/Sub Division Boundary.geojson');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const subDivMap = new Map<string, string>();

    for (const feature of data.features) {
        const subDivName = feature.properties?.SUB_DIV?.trim() || feature.properties?.SUBDIV_NM?.trim() || feature.properties?.NAME?.trim();
        const districtName = feature.properties?.DISTRICT?.trim() || feature.properties?.DIST_NM?.trim();

        if (!subDivName || !districtName) continue;

        const code = subDivName.replace(/\s+/g, '_').toUpperCase();
        const districtId = districtMap.get(districtName.toUpperCase());

        if (!districtId) {
            console.log(`  ⚠️  Skipping ${subDivName}: District not found`);
            continue;
        }

        const subDiv = await prisma.subDivision.upsert({
            where: { code },
            update: {
                name: subDivName,
                districtId,
                area: feature.properties?.AREA__SQKM ? String(feature.properties.AREA__SQKM) : null,
                isActive: true
            },
            create: {
                code,
                name: subDivName,
                districtId,
                area: feature.properties?.AREA__SQKM ? String(feature.properties.AREA__SQKM) : null,
                isActive: true
            }
        });

        subDivMap.set(subDivName.toUpperCase(), subDiv.id);
        console.log(`  ✅ ${subDivName} (District: ${districtName})`);
    }

    return subDivMap;
}

async function seedPoliceStations(
    rangeMap: Map<string, string>,
    districtMap: Map<string, string>,
    subDivMap: Map<string, string>
): Promise<{ created: number; updated: number }> {
    const filePath = path.join(__dirname, '../jsongeo/Police Station Location.geojson');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let created = 0;
    let updated = 0;

    for (const feature of data.features) {
        const psName = feature.properties?.NAME?.trim();
        const districtName = feature.properties?.DISTRICT?.trim();
        const [longitude, latitude] = feature.geometry.coordinates;

        if (!psName || !districtName) continue;

        const districtId = districtMap.get(districtName.toUpperCase());
        if (!districtId) {
            console.log(`  ⚠️  Skipping ${psName}: District not found`);
            continue;
        }

        // Get district to find range
        const district = await prisma.district.findUnique({
            where: { id: districtId },
            include: { SubDivision: true }
        });

        const rangeId = district?.rangeId;
        let subDivisionId = district?.SubDivision?.[0]?.id;

        if (!rangeId) {
            console.log(`    Skipping ${psName}: Missing rangeId`);
            continue;
        }

        // If no sub-division exists, create a default one for this district
        if (!subDivisionId) {
            const defaultSubDiv = await prisma.subDivision.upsert({
                where: { code: `${districtName.toUpperCase()}_DEFAULT` },
                update: {},
                create: {
                    code: `${districtName.toUpperCase()}_DEFAULT`,
                    name: `${districtName} Sub-Division`,
                    districtId: districtId,
                    isActive: true
                }
            });
            subDivisionId = defaultSubDiv.id;
        }

        // Try exact match first (case-insensitive)
        let existing = await prisma.policeStation.findFirst({
            where: {
                name: {
                    equals: psName,
                    mode: 'insensitive'
                }
            }
        });

        // If no exact match, try without "PS " prefix
        if (!existing && psName.startsWith('PS ')) {
            const nameWithoutPS = psName.substring(3);
            existing = await prisma.policeStation.findFirst({
                where: {
                    name: {
                        equals: nameWithoutPS,
                        mode: 'insensitive'
                    }
                }
            });
        }

        if (existing) {
            await prisma.policeStation.update({
                where: { id: existing.id },
                data: {
                    latitude,
                    longitude,
                    districtId,
                    rangeId,
                    subDivisionId,
                    isActive: true
                }
            });
            console.log(`  🔄 Updated: ${psName}`);
            updated++;
        } else {
            const code = psName.replace(/\s+/g, '_').toUpperCase();
            await prisma.policeStation.create({
                data: {
                    code,
                    name: psName,
                    address: psName,
                    latitude,
                    longitude,
                    rangeId,
                    districtId,
                    subDivisionId,
                    isActive: true
                }
            });
            console.log(`  ✅ Created: ${psName}`);
            created++;
        }
    }

    return { created, updated };
}

// Run
main().catch(console.error);
