import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function updatePoliceStationCoordinates() {
    console.log('🔄 Starting to update police station coordinates from GeoJSON...\n');

    try {
        // Read the GeoJSON file
        const psPath = path.join(__dirname, '../../jsongeo/Police Station Location.geojson');
        const psRaw = fs.readFileSync(psPath, 'utf8');
        const psGeo = JSON.parse(psRaw);

        console.log(`📦 Found ${psGeo.features.length} police stations in GeoJSON file\n`);

        let updated = 0;
        let notFound = 0;
        let skipped = 0;

        for (const feature of psGeo.features) {
            const props = feature.properties;
            const name = props.NAME.trim();
            const coords = feature.geometry.coordinates; // [long, lat]
            const longitude = coords[0];
            const latitude = coords[1];

            // Try to find the police station by name (case-insensitive)
            const policeStation = await prisma.policeStation.findFirst({
                where: {
                    name: {
                        equals: name,
                        mode: 'insensitive'
                    }
                }
            });

            if (policeStation) {
                // Update the coordinates
                await prisma.policeStation.update({
                    where: { id: policeStation.id },
                    data: {
                        latitude: latitude,
                        longitude: longitude
                    }
                });
                console.log(`✅ Updated: ${name} (${latitude}, ${longitude})`);
                updated++;
            } else {
                console.log(`⚠️  Not found in DB: ${name}`);
                notFound++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⚠️  Not found: ${notFound}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`\n🎉 Done!`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the update
updatePoliceStationCoordinates()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
