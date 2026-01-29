import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to title case names (e.g., "SOUTH WEST" -> "South West")
function toTitleCase(str: string) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
// Helper to generate a code from name
function generateCode(name: string) {
    if (!name) return 'UNKNOWN_' + Date.now();
    return name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

async function seedGeoJSON() {
    const geoFile = path.join(__dirname, '../jsongeo/Police Station Boundary.geojson');
    console.log(`Reading ${geoFile}...`);

    const raw = fs.readFileSync(geoFile, 'utf8');
    const data = JSON.parse(raw);
    const features = data.features || [];

    console.log(`Found ${features.length} station features.`);

    // Sets to track what we've seen to avoid redundant DB calls/checks
    // Using Maps to store hierarchy: Name -> Object
    const ranges = new Map<string, any>();
    const districts = new Map<string, any>();
    const subDivisions = new Map<string, any>();
    const stations = new Map<string, any>();

    // Pass 1: aggregated structural data
    for (const feature of features) {
        const p = feature.properties;
        const rangeName = p.RANGE;
        const distName = p.DIST_NM || p.DISTRICT; // Fallback
        const subDivName = p.SUB_DIVISI;
        const psName = p.POL_STN_NM;

        if (!rangeName || !distName || !subDivName || !psName) {
            console.warn('Skipping incomplete feature:', p);
            continue;
        }

        const rangeCode = generateCode(rangeName);
        const distCode = generateCode(distName);
        const subDivCode = generateCode(subDivName); // SubDivision code might collision if diff districts have same sub? Unlikely.
        const psCode = generateCode(psName);

        // Store Range
        if (!ranges.has(rangeCode)) {
            ranges.set(rangeCode, { name: toTitleCase(rangeName), code: rangeCode });
        }

        // Store District (linked to Range)
        if (!districts.has(distCode)) {
            districts.set(distCode, {
                name: toTitleCase(distName),
                code: distCode,
                rangeCode
            });
        }

        // Store SubDivision (linked to District)
        // Note: SubDivision names might not be unique globally, but usually are locally.
        // We key by Name for now, assuming uniqueness or just taking first parent.
        // Safety: Key by Dist+SubDiv to be safe?
        // Let's key by SubDivName to keep it simple, usually unique enough or we merge.
        if (!subDivisions.has(subDivCode)) {
             subDivisions.set(subDivCode, { name: toTitleCase(subDivName), code: subDivCode, districtCode: distCode });
        }

        // Store Station
        stations.set(psCode, {
            name: toTitleCase(psName),
            code: psCode,
            subDivCode,
            address: toTitleCase(psName)
        });
    }

    // Pass 2: DB Upserts using CODE as unique identifier

    console.log(`Upserting ${ranges.size} Ranges...`);
    for (const [code, data] of ranges) {
        // Range code is nullable unique? Schema says String? @unique. So we can upsert on code if we provide it.
        // But let's check if code is null in DB for existing?
        // Safer: Find by name first? No, let's assume we are establishing the codes now.
        const range = await prisma.range.upsert({
            where: { code: code },
            update: { name: data.name },
            create: { name: data.name, code: code }
        });
        // Store ID back in map for children to use
        data.id = range.id;
    }

    console.log(`Upserting ${districts.size} Districts...`);
    for (const [code, data] of districts) {
        const range = ranges.get(data.rangeCode);
        if (!range?.id) continue;

        const district = await prisma.district.upsert({
            where: { code: code },
            update: { name: data.name, rangeId: range.id },
            create: { name: data.name, code: code, rangeId: range.id, area: 'N/A', headquarters: 'N/A' } // Required fields
        });
        data.id = district.id;
    }

    console.log(`Upserting ${subDivisions.size} SubDivisions...`);
    for (const [code, data] of subDivisions) {
        const dist = districts.get(data.districtCode);
        if (!dist?.id) continue;

        const sub = await prisma.subDivision.upsert({
            where: { code: code },
            update: { name: data.name, districtId: dist.id },
            create: { name: data.name, code: code, districtId: dist.id }
        });
        data.id = sub.id;
    }

    console.log(`Upserting ${stations.size} Police Stations...`);
    for (const [code, data] of stations) {
        const sub = subDivisions.get(data.subDivCode);
        if (!sub?.id) continue;

        const ps = await prisma.policeStation.upsert({
            where: { code: code },
            update: { name: data.name, subDivisionId: sub.id, address: data.address },
            create: { name: data.name, code: code, subDivisionId: sub.id, address: data.address }
        });

        // Ensure at least one Beat exists for this Station
        const beatCode = code + '_BEAT_GEN';
        await prisma.beat.upsert({
            where: { code: beatCode }, // Beat code is unique
            update: {},
            create: { name: 'General Beat', code: beatCode, policeStationId: ps.id }
        });
    }

    console.log('Seeding Complete.');
}

seedGeoJSON()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
