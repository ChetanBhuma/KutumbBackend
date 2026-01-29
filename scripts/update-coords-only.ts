/**
 * Simple script to ONLY update coordinates for existing police stations
 * This won't create new ones, just adds lat/lng to existing records
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function updateCoordinates() {
    console.log('🔄 Updating police station coordinates...\n');

    const geoPath = path.join(__dirname, '../jsongeo/Police Station Location.geojson');
    const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

    let updated = 0;
    let notFound = 0;

    for (const feature of geoData.features) {
        const psName = feature.properties?.NAME?.trim();
        const [longitude, latitude] = feature.geometry.coordinates;

        if (!psName) continue;

        // Try exact match
        let ps = await prisma.policeStation.findFirst({
            where: {
                name: { equals: psName, mode: 'insensitive' }
            }
        });

        // Try without "PS " prefix
        if (!ps && psName.startsWith('PS ')) {
            const nameWithoutPS = psName.substring(3);
            ps = await prisma.policeStation.findFirst({
                where: {
                    name: { equals: nameWithoutPS, mode: 'insensitive' }
                }
            });
        }

        if (ps) {
            await prisma.policeStation.update({
                where: { id: ps.id },
                data: { latitude, longitude }
            });
            console.log(`✅ ${psName}`);
            updated++;
        } else {
            console.log(`⚠️  Not found: ${psName}`);
            notFound++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Not found: ${notFound}`);

    await prisma.$disconnect();
}

updateCoordinates().catch(console.error);
