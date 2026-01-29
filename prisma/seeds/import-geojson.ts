import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const geojsonPath = path.join(__dirname, '../../jsongeo/dist.geojson');

    if (!fs.existsSync(geojsonPath)) {
        console.error(`File not found: ${geojsonPath}`);
        return;
    }

    const rawData = fs.readFileSync(geojsonPath, 'utf8');
    const geojson = JSON.parse(rawData);

    console.log(`Found ${geojson.features.length} features in GeoJSON.`);

    for (const feature of geojson.features) {
        const props = feature.properties;
        const districtName = props.DISTRICT; // e.g., "SOUTH WEST"

        // Use RANGE from property or derive from District Name (often identical in simple datasets, but here we use what's available)
        // Some districts might share a range. The schema has 'range' field on District.
        const rangeName = props.RANGE || districtName;

        // Generate a code if not present (simple slug)
        const districtCode = districtName.replace(/\s+/g, '_').toUpperCase();

        console.log(`Processing District: ${districtName} (Range: ${rangeName})`);

        // Check if District exists
        const existingDistrict = await prisma.district.findFirst({
            where: {
                OR: [
                    { code: districtCode },
                    { name: districtName } // Fallback check by name
                ]
            }
        });

        if (existingDistrict) {
            console.log(`District ${districtName} already exists. Updating...`);
            await prisma.district.update({
                where: { id: existingDistrict.id },
                data: {
                    name: districtName,
                    range: rangeName,
                    area: props.AREA__SQKM ? String(props.AREA__SQKM) : existingDistrict.area,
                    // We don't have explicit headquarters or population in this GeoJSON, preserve existing or use defaults
                }
            });
        } else {
            console.log(`Creating new District: ${districtName}`);
            await prisma.district.create({
                data: {
                    name: districtName,
                    code: districtCode,
                    range: rangeName,
                    area: props.AREA__SQKM ? String(props.AREA__SQKM) : "0",
                    headquarters: districtName, // Default to name
                    population: 0
                }
            });
        }
    }
    console.log('District import completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
