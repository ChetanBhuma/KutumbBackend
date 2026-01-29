import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Clean and Seed process for GeoJSON data...');

    // 1. Clean existing data
    console.log('Cleaning existing data...');
    try {
        // We need to delete in valid order due to foreign keys
        // Beat depends on PoliceStation
        await prisma.beatOfficer.deleteMany({});
        await prisma.beat.deleteMany({}); // Beats depend on Police Stations

        // We need to unlink SeniorCitizens before deleting Stations/Districts to avoid constraint errors
        // Or we rely on SetNull if configured. Schema says:
        // PoliceStation PoliceStation? @relation(fields: [policeStationId], references: [id])
        // It doesn't specify onDelete behavior, so it defaults to Restrict usually in Prisma unless specified.
        // Let's try to update SeniorCitizens to set station/district to null if possible, or just hope generic delete works if no citizens exist.
        // Since "clean dummy data" suggests a fresh start or reset, but usually we don't want to lose user profiles.
        // Let's update all SeniorCitizens to remove links to old IDs.
        await prisma.seniorCitizen.updateMany({
            data: {
                policeStationId: null,
                districtId: null,
                beatId: null
            }
        });

        await prisma.policeStation.deleteMany({});
        await prisma.district.deleteMany({});

        console.log('Cleaned: BeatOfficer, Beat, PoliceStation, District.');
    } catch (error) {
        console.error('Error during cleanup:', error);
        // Continue? If cleanup fails, seeding might fail or duplicate.
        // But maybe tables are already empty.
    }

    // 2. Import Districts
    console.log('\nImporting Districts...');
    const distPath = path.join(__dirname, '../../jsongeo/dist.geojson');
    const distRaw = fs.readFileSync(distPath, 'utf8');
    const distGeoCallback = JSON.parse(distRaw);

    const districtMap = new Map<string, string>(); // Name -> ID

    for (const feature of distGeoCallback.features) {
        const props = feature.properties;
        const name = props.DISTRICT.trim();
        const range = props.RANGE || name;
        const code = name.replace(/\s+/g, '_').toUpperCase();

        // Check duplication
        if (districtMap.has(name)) continue;

        console.log(`Creating District: ${name}`);
        const dist = await prisma.district.create({
            data: {
                name: name,
                code: code,
                range: range,
                area: props.AREA__SQKM ? String(props.AREA__SQKM) : "0",
                headquarters: name,
                isActive: true
            }
        });
        districtMap.set(name, dist.id);

        // Also map uppercase normalization if needed
        districtMap.set(name.toUpperCase(), dist.id);
    }

    // 3. Import Police Stations
    console.log('\nImporting Police Stations...');
    const psPath = path.join(__dirname, '../../jsongeo/ps.geojson');
    const psRaw = fs.readFileSync(psPath, 'utf8');
    const psGeo = JSON.parse(psRaw);

    for (const feature of psGeo.features) {
        const props = feature.properties;
        const name = props.NAME.trim();
        const districtName = props.DISTRICT ? props.DISTRICT.trim() : null;

        const coords = feature.geometry.coordinates; // [long, lat]
        const longitude = coords[0];
        const latitude = coords[1];

        let districtId = null;
        if (districtName) {
            // Try explicit match
            districtId = districtMap.get(districtName) || districtMap.get(districtName.toUpperCase());

            if (!districtId) {
                // If district doesn't exist (mismatch in naming), try to find closely or log warning
                console.warn(`Warning: District '${districtName}' for PS '${name}' not found in created districts.`);
                // Could retry fetching from DB if map missing something, but map is fresh.
            }
        }

        const code = name.replace(/\s+/g, '_').toUpperCase().replace('PS_', 'PS_'); // Simple slug

        console.log(`Creating PS: ${name} (District: ${districtName})`);

        // Create PS
        await prisma.policeStation.create({
            data: {
                name: name,
                code: code,
                districtId: districtId,
                address: name, // Default address
                latitude: latitude,
                longitude: longitude,
                isActive: true
            }
        });
    }

    console.log('\nGeoJSON Seed Completed Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
