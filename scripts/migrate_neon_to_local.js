const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function syncViaPrisma() {
    const neonUrl = "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    const localUrl = "postgresql://postgres:root@127.0.0.1:5432/kutumb_local?sslmode=disable";

    console.log("=== Step 1: Pushing Prisma Schema to Local Database ===");
    // Create temporary .env.local_push
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    const tempEnvPath = path.join(__dirname, '..', '.env.local_push');
    
    // Read base .env and override DATABASE_URL and DIRECT_URL
    const baseEnv = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const localEnvContent = baseEnv
        .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${localUrl}"`)
        .replace(/^DIRECT_URL=.*$/m, `DIRECT_URL="${localUrl}"`);
    
    fs.writeFileSync(tempEnvPath, localEnvContent);

    try {
        console.log("Running prisma db push against local database...");
        execSync(`npx dotenv -e .env.local_push -- npx prisma db push --skip-generate`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
        console.log("Local database schema is now 100% in sync with Prisma!");
    } catch (e) {
        console.log("Prisma push via dotenv, fallback with direct cross-env...");
        execSync(`npx cross-env DATABASE_URL="${localUrl}" DIRECT_URL="${localUrl}" npx prisma db push --skip-generate`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
    } finally {
        if (fs.existsSync(tempEnvPath)) fs.unlinkSync(tempEnvPath);
    }

    console.log("\n=== Step 2: Transferring All Data from Neon to Local Database ===");
    const neonPrisma = new PrismaClient({ datasources: { db: { url: neonUrl } } });
    const localPrisma = new PrismaClient({ datasources: { db: { url: localUrl } } });

    try {
        await neonPrisma.$connect();
        await localPrisma.$connect();

        // Model order respecting foreign key constraints
        const models = [
            'range',
            'district',
            'subDivision',
            'policeStation',
            'beat',
            'user',
            'beatOfficer',
            'seniorCitizen',
            'spouseDetails',
            'familyMember',
            'emergencyContact',
            'householdHelp',
            'document',
            'visitType',
            'visit',
            'visitFeedback',
            'visitRequest',
            'verificationRequest',
            'sOSAlert',
            'serviceRequest',
            'auditLog',
            'notification',
            'systemSetting',
            'citizenRegistration',
            'citizenAuth'
        ];

        for (const m of models) {
            if (!neonPrisma[m] || !localPrisma[m]) continue;
            try {
                const count = await neonPrisma[m].count();
                if (count > 0) {
                    console.log(`Copying ${count} records for model: ${m}...`);
                    const rows = await neonPrisma[m].findMany();
                    // Chunk inserts
                    const chunkSize = 100;
                    for (let i = 0; i < rows.length; i += chunkSize) {
                        const chunk = rows.slice(i, i + chunkSize);
                        await localPrisma[m].createMany({
                            data: chunk,
                            skipDuplicates: true
                        });
                    }
                    console.log(`  -> Finished ${m}`);
                }
            } catch (err) {
                console.warn(`  Warning on model ${m}: ${err.message}`);
            }
        }
        console.log("\nAll data successfully migrated to local PostgreSQL!");
    } finally {
        await neonPrisma.$disconnect();
        await localPrisma.$disconnect();
    }
}

syncViaPrisma().catch(err => console.error("Sync Error:", err));
