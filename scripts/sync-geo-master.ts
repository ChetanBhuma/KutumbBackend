
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Starting Geo Master Sync...');

        // 1. Sync Districts
        // We read "District Boundary.geojson" but also infer from "Police Station Boundary.geojson" 
        // to get the Range and other details if missing.

        const psPath = path.join(__dirname, '../jsongeo/Police Station Boundary.geojson');

        if (!fs.existsSync(psPath)) {
            console.error('❌ GeoJSON file not found:', psPath);
            return;
        }

        const psData = JSON.parse(fs.readFileSync(psPath, 'utf-8'));
        console.log(`📂 Loaded ${psData.features.length} Police Station features.`);

        // Deduplicate Districts from PS Data first (since it contains RANGE info)
        const districtMap = new Map<string, { range?: string }>();

        for (const feature of psData.features) {
            const distName = feature.properties.DIST_NM;
            const range = feature.properties.RANGE;
            if (distName) {
                districtMap.set(distName, { range: range || undefined });
            }
        }

        console.log(`📍 Identified ${districtMap.size} Districts from PS Data.`);

        // Upsert Districts
        for (const [name, data] of districtMap) {
            const existing = await prisma.district.findFirst({ where: { name } });

            if (existing) {
                if (data.range && existing.range !== data.range) {
                    console.log(`   Updating District ${name} Range: ${data.range}`);
                    await prisma.district.update({ where: { id: existing.id }, data: { range: data.range } });
                }
            } else {
                console.log(`   Creating District: ${name} (Range: ${data.range})`);
                await prisma.district.create({
                    data: {
                        name,
                        range: data.range || 'UNKNOWN',
                        code: name.toUpperCase().replace(/\s+/g, '_'),
                        area: '0', // Default if missing
                        headquarters: `${name} HQ`
                    }
                });
            }
        }

        // 2. Sync Police Stations
        let psCreated = 0;
        let psUpdated = 0;

        for (const feature of psData.features) {
            const psName = feature.properties.POL_STN_NM;
            const distName = feature.properties.DIST_NM;

            if (!psName || !distName) {
                console.warn('   ⚠️ Skipping feature with missing Name or District:', feature.properties);
                continue;
            }

            // Find District
            const district = await prisma.district.findFirst({ where: { name: distName } });
            if (!district) {
                console.error(`   ❌ District not found for PS ${psName}: ${distName}`);
                continue;
            }

            // Upsert PS
            const existingPs = await prisma.policeStation.findFirst({ where: { name: psName } });

            if (existingPs) {
                if (existingPs.districtId !== district.id) {
                    await prisma.policeStation.update({
                        where: { id: existingPs.id },
                        data: { districtId: district.id }
                    });
                    psUpdated++;
                }
            } else {
                await prisma.policeStation.create({
                    data: {
                        name: psName,
                        districtId: district.id,
                        code: psName.toUpperCase().replace(/\s+/g, '_'),
                        address: 'Address not available'
                    }
                });
                psCreated++;
            }
        }

        console.log(`✅ PS Sync Complete: ${psCreated} created, ${psUpdated} updated.`);

        // 3. Process Beat Data? (If requested later, we can add "Beat Boundary.geojson")

    } catch (error) {
        console.error('❌ Error during sync:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
