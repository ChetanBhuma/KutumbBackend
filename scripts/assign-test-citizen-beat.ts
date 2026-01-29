import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignTestCitizenToBeat() {
    try {
        console.log('🔍 Finding Test Citizen and assigning to beat...\n');

        // Find Test Citizen
        const testCitizen = await prisma.seniorCitizen.findFirst({
            where: {
                OR: [
                    { fullName: { contains: 'Test Citizen', mode: 'insensitive' } },
                    { mobileNumber: '9090009090' }
                ]
            },
            include: {
                PoliceStation: true
            }
        });

        if (!testCitizen) {
            console.log('❌ Test Citizen not found!');
            return;
        }

        console.log('✅ Found Test Citizen:');
        console.log(`   Name: ${testCitizen.fullName}`);
        console.log(`   Police Station: ${testCitizen.PoliceStation?.name}\n`);

        // Find a beat at the police station with officers
        const beatWithOfficers = await prisma.beat.findFirst({
            where: {
                policeStationId: testCitizen.policeStationId!,
                BeatOfficer: {
                    some: {
                        isActive: true
                    }
                }
            },
            include: {
                BeatOfficer: {
                    where: { isActive: true }
                }
            }
        });

        if (!beatWithOfficers) {
            console.log('❌ No beats with officers found at this police station!');
            return;
        }

        console.log(`✅ Found Beat: ${beatWithOfficers.name}`);
        console.log(`   Officers: ${beatWithOfficers.BeatOfficer.length}\n`);

        // Update Test Citizen with beat assignment
        const updated = await prisma.seniorCitizen.update({
            where: { id: testCitizen.id },
            data: {
                beatId: beatWithOfficers.id
            }
        });

        console.log('✅ Test Citizen assigned to beat successfully!\n');
        console.log('📋 Summary:');
        console.log(`   Citizen: ${testCitizen.fullName}`);
        console.log(`   Beat: ${beatWithOfficers.name}`);
        console.log(`   Officers in Beat: ${beatWithOfficers.BeatOfficer.length}`);
        console.log(`   Officers:`);
        beatWithOfficers.BeatOfficer.forEach((officer, index) => {
            console.log(`     ${index + 1}. ${officer.name} (${officer.badgeNumber})`);
        });

        console.log('\n✨ Now the Test Citizen can trigger SOS alerts and officers will be notified!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignTestCitizenToBeat()
    .then(() => {
        console.log('\nScript completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
