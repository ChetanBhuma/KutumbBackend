import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignCitizenToOfficer() {
    try {
        console.log('🔍 Finding citizen: Test Citizen (9090009090)...\n');

        // Find the citizen
        const citizen = await prisma.seniorCitizen.findFirst({
            where: {
                OR: [
                    { fullName: { contains: 'Test Citizen', mode: 'insensitive' } },
                    { mobileNumber: '9090009090' }
                ]
            },
            include: {
                PoliceStation: true,
                District: true
            }
        });

        if (!citizen) {
            console.log('❌ Citizen not found!');
            return;
        }

        console.log('✅ Found citizen:');
        console.log(`   Name: ${citizen.fullName}`);
        console.log(`   Mobile: ${citizen.mobileNumber}`);
        console.log(`   Police Station: ${citizen.PoliceStation?.name || 'Not assigned'}`);
        console.log(`   District: ${citizen.District?.name || 'Not assigned'}\n`);

        if (!citizen.policeStationId) {
            console.log('❌ Citizen has no police station assigned!');
            return;
        }

        // Find officers at the police station
        console.log('🔍 Finding officers at police station...\n');

        const officers = await prisma.beatOfficer.findMany({
            where: {
                policeStationId: citizen.policeStationId,
                isActive: true
            },
            include: {
                PoliceStation: true
            }
        });

        if (officers.length === 0) {
            console.log('❌ No officers found at this police station!');
            return;
        }

        console.log(`✅ Found ${officers.length} officer(s):\n`);
        officers.forEach((officer, index) => {
            console.log(`   ${index + 1}. ${officer.name} (${officer.badgeNumber})`);
        });

        // Calculate workload for each officer
        console.log('\n📊 Calculating workload...\n');

        const officersWithWorkload = await Promise.all(
            officers.map(async (officer) => {
                const workload = await prisma.visit.count({
                    where: {
                        officerId: officer.id,
                        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
                    }
                });
                return { ...officer, workload };
            })
        );

        officersWithWorkload.forEach((officer) => {
            console.log(`   ${officer.name}: ${officer.workload} pending visits`);
        });

        // Select officer with least workload
        const selectedOfficer = officersWithWorkload.reduce((min, officer) =>
            officer.workload < min.workload ? officer : min
        );

        console.log(`\n✅ Selected officer: ${selectedOfficer.name} (${selectedOfficer.badgeNumber})`);
        console.log(`   Current workload: ${selectedOfficer.workload} visits\n`);

        // Check if verification request already exists
        const existingRequest = await prisma.verificationRequest.findFirst({
            where: {
                seniorCitizenId: citizen.id,
                entityType: 'SeniorCitizen'
            }
        });

        if (existingRequest) {
            console.log('ℹ️  Verification request already exists');
            console.log(`   Status: ${existingRequest.status}`);
            console.log(`   Assigned to: ${existingRequest.assignedTo || 'Not assigned'}\n`);

            if (existingRequest.assignedTo) {
                console.log('⚠️  Already assigned to an officer. Updating assignment...\n');
            }

            // Update existing request
            await prisma.verificationRequest.update({
                where: { id: existingRequest.id },
                data: {
                    assignedTo: selectedOfficer.id,
                    assignedAt: new Date(),
                    status: 'IN_PROGRESS'
                }
            });

            console.log('✅ Updated verification request assignment');

        } else {
            // Create new verification request
            console.log('📝 Creating verification request...\n');

            const verificationRequest = await prisma.verificationRequest.create({
                data: {
                    entityType: 'SeniorCitizen',
                    entityId: citizen.id,
                    seniorCitizenId: citizen.id,
                    requestedBy: 'SYSTEM',
                    priority: 'Normal',
                    remarks: 'Manual assignment via script',
                    assignedTo: selectedOfficer.id,
                    assignedAt: new Date(),
                    status: 'IN_PROGRESS'
                }
            });

            console.log('✅ Created verification request:', verificationRequest.id);
        }

        // Create or update visit
        const existingVisit = await prisma.visit.findFirst({
            where: {
                seniorCitizenId: citizen.id,
                visitType: 'Verification',
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
            }
        });

        if (existingVisit) {
            console.log('\nℹ️  Verification visit already exists');
            console.log(`   Visit ID: ${existingVisit.id}`);
            console.log(`   Status: ${existingVisit.status}\n`);
        } else {
            console.log('\n📅 Creating verification visit...\n');

            const visit = await prisma.visit.create({
                data: {
                    seniorCitizenId: citizen.id,
                    officerId: selectedOfficer.id,
                    policeStationId: selectedOfficer.policeStationId!,
                    beatId: selectedOfficer.beatId || citizen.beatId,
                    visitType: 'Verification',
                    status: 'SCHEDULED',
                    scheduledDate: new Date(),
                    priority: 'Normal'
                }
            });

            console.log('✅ Created verification visit:', visit.id);
        }

        console.log('\n✨ Assignment completed successfully!\n');
        console.log('📋 Summary:');
        console.log(`   Citizen: ${citizen.fullName}`);
        console.log(`   Officer: ${selectedOfficer.name} (${selectedOfficer.badgeNumber})`);
        console.log(`   Police Station: ${selectedOfficer.PoliceStation?.name}`);
        console.log(`   Status: IN_PROGRESS\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
assignCitizenToOfficer()
    .then(() => {
        console.log('Script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
