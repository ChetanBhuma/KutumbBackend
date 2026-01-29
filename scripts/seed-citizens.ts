import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedCitizens() {
    console.log('🌱 Seeding citizens for login testing...\n');

    try {
        const citizenPassword = await bcrypt.hash('Citizen@123', 10);

        // First, check if we have district, police station, and beat
        let district = await prisma.district.findFirst();
        if (!district) {
            district = await prisma.district.create({
                data: {
                    name: 'Central District',
                    code: 'CENTRAL',
                    range: 'Central Range',
                    area: 'Central Delhi',
                    headquarters: 'New Delhi',
                },
            });
            console.log('✅ District created:', district.name);
        }

        let policeStation = await prisma.policeStation.findFirst();
        if (!policeStation) {
            policeStation = await prisma.policeStation.create({
                data: {
                    name: 'Connaught Place PS',
                    code: 'CP_PS',
                    districtId: district.id,
                    address: 'Connaught Place, New Delhi',
                    phone: '011-23412345',
                },
            });
            console.log('✅ Police Station created:', policeStation.name);
        }

        let beat = await prisma.beat.findFirst();
        if (!beat) {
            beat = await prisma.beat.create({
                data: {
                    name: 'Beat-001',
                    code: 'BEAT001',
                    policeStationId: policeStation.id,
                },
            });
            console.log('✅ Beat created:', beat.name);
        }

        // Create CitizenAuth entry for phone 9876543230
        console.log('\nCreating CitizenAuth for 9876543230...');
        const citizenAuth = await prisma.citizenAuth.upsert({
            where: { mobileNumber: '9876543230' },
            update: {
                password: citizenPassword,
                isVerified: true,
            },
            create: {
                mobileNumber: '9876543230',
                password: citizenPassword,
                isVerified: true,
                registrationStep: 7, // Completed
            },
        });
        console.log('✅ CitizenAuth created for:', citizenAuth.mobileNumber);

        // Create SeniorCitizen profile
        console.log('\nCreating SeniorCitizen profile...');
        const citizen = await prisma.seniorCitizen.upsert({
            where: { mobileNumber: '9876543230' },
            update: {
                fullName: 'Mr. Ram Prasad',
            },
            create: {
                fullName: 'Mr. Ram Prasad',
                mobileNumber: '9876543230',
                aadhaarNumber: '123456789012',
                dateOfBirth: new Date('1952-01-15'),
                age: 73,
                gender: 'Male',
                permanentAddress: 'Connaught Place, New Delhi',
                pinCode: '110001',
                status: 'VERIFIED',
                districtId: district.id,
                policeStationId: policeStation.id,
                beatId: beat.id,
            },
        });
        console.log('✅ SeniorCitizen profile created:', citizen.fullName);

        // Link CitizenAuth to SeniorCitizen
        await prisma.citizenAuth.update({
            where: { mobileNumber: '9876543230' },
            data: {
                citizenId: citizen.id,
            },
        });
        console.log('✅ CitizenAuth linked to SeniorCitizen profile');

        console.log('\n🎉 Citizen seeding completed successfully!\n');
        console.log('═══════════════════════════════════════════════');
        console.log('📋 TEST CREDENTIALS');
        console.log('═══════════════════════════════════════════════');
        console.log('\n👴 CITIZEN:');
        console.log('   Phone: 9876543230');
        console.log('   Password: Citizen@123');
        console.log('   Name:', citizen.fullName);
        console.log('═══════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error seeding citizens:', error);
        throw error;
    }
}

seedCitizens()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
