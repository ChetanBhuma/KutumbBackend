import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function compareNames() {
    // Get all PS from database
    const dbPS = await prisma.policeStation.findMany({
        where: { isActive: true },
        select: { name: true },
        orderBy: { name: 'asc' }
    });

    // Get all PS from GeoJSON
    const geoPath = path.join(__dirname, '../jsongeo/Police Station Location.geojson');
    const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));
    const geoPS = geoData.features.map((f: any) => f.properties.NAME).sort();

    console.log(`📊 Database PS: ${dbPS.length}`);
    console.log(`📊 GeoJSON PS: ${geoPS.length}\n`);

    // Find matches
    const dbNames = new Set(dbPS.map(ps => ps.name.toUpperCase()));
    const geoNames = new Set(geoPS.map((name: string) => name.toUpperCase()));

    const exactMatches = geoPS.filter((name: string) => dbNames.has(name.toUpperCase()));
    const inGeoNotInDB = geoPS.filter((name: string) => !dbNames.has(name.toUpperCase()));
    const inDBNotInGeo = dbPS.filter(ps => !geoNames.has(ps.name.toUpperCase()));

    console.log(`✅ Exact matches: ${exactMatches.length}`);
    console.log(`⚠️  In GeoJSON but not in DB: ${inGeoNotInDB.length}`);
    console.log(`⚠️  In DB but not in GeoJSON: ${inDBNotInGeo.length}\n`);

    if (inGeoNotInDB.length > 0) {
        console.log('📝 First 10 in GeoJSON but not in DB:');
        inGeoNotInDB.slice(0, 10).forEach((name: string) => console.log(`   - ${name}`));
    }

    if (inDBNotInGeo.length > 0) {
        console.log('\n📝 First 10 in DB but not in GeoJSON:');
        inDBNotInGeo.slice(0, 10).forEach(ps => console.log(`   - ${ps.name}`));
    }

    await prisma.$disconnect();
}

compareNames().catch(console.error);
