import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createBeatOfficers() {
    try {
        console.log('🚀 Starting bulk officer creation...\n');

        // Fetch all active police stations with their districts
        const policeStations = await prisma.policeStation.findMany({
            where: { isActive: true },
            include: {
                District: true,
                Beat: true
            },
            orderBy: { name: 'asc' }
        });

        console.log(`📍 Found ${policeStations.length} police stations\n`);

        let totalCreated = 0;
        let totalSkipped = 0;
        const errors: string[] = [];

        // Ranks to assign
        const ranks = ['Constable', 'Head Constable', 'Constable'];

        for (const ps of policeStations) {
            console.log(`\n🏢 Processing: ${ps.name} (${ps.code})`);

            // Create 2-3 officers per police station
            const officersToCreate = 2;

            for (let i = 1; i <= officersToCreate; i++) {
                try {
                    const badgeNumber = `BO-${ps.code}-${String(i).padStart(3, '0')}`;
                    const mobileNumber = `98765${String(totalCreated + 1).padStart(5, '0')}`;
                    const email = `officer${i}@${ps.code.toLowerCase()}.police.in`;

                    // Check if officer already exists
                    const existing = await prisma.beatOfficer.findFirst({
                        where: {
                            OR: [
                                { badgeNumber },
                                { mobileNumber }
                            ]
                        }
                    });

                    if (existing) {
                        console.log(`  ⏭️  Skipped: ${badgeNumber} (already exists)`);
                        totalSkipped++;
                        continue;
                    }

                    // Assign to first available beat or null
                    const beatId = ps.Beat && ps.Beat.length > 0 ? ps.Beat[0].id : null;

                    // Create officer
                    const officer = await prisma.beatOfficer.create({
                        data: {
                            name: `Beat Officer ${i} - ${ps.name}`,
                            rank: ranks[i - 1] || 'Constable',
                            badgeNumber,
                            mobileNumber,
                            email,
                            policeStationId: ps.id,
                            districtId: ps.districtId,
                            beatId,
                            isActive: true
                        }
                    });

                    // Create User account for officer login
                    const hashedPassword = await bcrypt.hash('Officer@123', 10);

                    await prisma.user.create({
                        data: {
                            email,
                            phone: mobileNumber,
                            passwordHash: hashedPassword,
                            role: 'OFFICER',
                            isActive: true,
                            officerId: officer.id
                        }
                    });

                    console.log(`  ✅ Created: ${officer.name} (${badgeNumber})`);
                    totalCreated++;

                } catch (error: any) {
                    const errorMsg = `Error creating officer ${i} for ${ps.name}: ${error.message}`;
                    console.error(`  ❌ ${errorMsg}`);
                    errors.push(errorMsg);
                }
            }
        }

        console.log('\n\n📊 Summary:');
        console.log(`✅ Officers created: ${totalCreated}`);
        console.log(`⏭️  Officers skipped: ${totalSkipped}`);
        console.log(`❌ Errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            errors.forEach(err => console.log(`  - ${err}`));
        }

        console.log('\n✨ Bulk officer creation completed!\n');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createBeatOfficers()
    .then(() => {
        console.log('Script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
