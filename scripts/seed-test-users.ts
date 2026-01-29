import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';


const prisma = new PrismaClient();

async function seedTestUsers() {
    console.log('🌱 Seeding test users for Senior Citizen Portal...\n');

    try {
        // Hash passwords
        const adminPassword = await bcrypt.hash('Admin@123', 10);
        const officerPassword = await bcrypt.hash('Officer@123', 10);
        const citizenPassword = await bcrypt.hash('Citizen@123', 10);

        // 1. Create Super Admin
        console.log('Creating Super Admin...');
        const admin = await prisma.user.upsert({
            where: { email: 'admin@delhipolice.gov.in' },
            update: {
                passwordHash: adminPassword,
                isActive: true,
            },
            create: {
                email: 'admin@delhipolice.gov.in',
                phone: '9876543210',
                passwordHash: adminPassword,
                role: 'SUPER_ADMIN',
                isActive: true,
            },
        });
        console.log('✅ Super Admin created:', admin.email);

        // 2. Create District Admin
        console.log('\nCreating District Admin...');
        const districtAdmin = await prisma.user.upsert({
            where: { email: 'district.admin@delhipolice.gov.in' },
            update: {
                passwordHash: adminPassword,
                isActive: true,
            },
            create: {
                email: 'district.admin@delhipolice.gov.in',
                phone: '9876543219',
                passwordHash: adminPassword,
                role: 'ADMIN',
                isActive: true,
            },
        });
        console.log('✅ District Admin created:', districtAdmin.email);

        // 3. Get or create Police Station and Beat for officers
        console.log('\nSetting up Police Station and Beat...');

        // Get first district or create one
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

        // Get or create Police Station
        let policeStation = await prisma.policeStation.findFirst({
            where: { name: 'Connaught Place PS' },
        });

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

        // Get or create Beat
        let beat = await prisma.beat.findFirst({
            where: { name: 'Beat-001' },
        });

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

        // 4. Create Beat Officer 1
        console.log('\nCreating Beat Officer 1...');
        const officer1User = await prisma.user.upsert({
            where: { email: 'officer1@delhipolice.gov.in' },
            update: {
                passwordHash: officerPassword,
                isActive: true,
            },
            create: {
                email: 'officer1@delhipolice.gov.in',
                phone: '9876543220',
                passwordHash: officerPassword,
                role: 'OFFICER',
                isActive: true,
            },
        });

        const officer1 = await prisma.beatOfficer.upsert({
            where: { badgeNumber: '28120039' },
            update: {
                name: 'Constable Rajesh Kumar',
            },
            create: {
                badgeNumber: '28120039',
                mobileNumber: '9876543220',
                name: 'Constable Rajesh Kumar',
                rank: 'Constable',
                policeStationId: policeStation.id,
                beatId: beat.id,
            },
        });

        await prisma.user.update({
            where: { id: officer1User.id },
            data: { officerId: officer1.id }
        });
        console.log('✅ Beat Officer 1 created - Badge:', officer1.badgeNumber);

        // 5. Create Beat Officer 2
        console.log('\nCreating Beat Officer 2...');
        const officer2User = await prisma.user.upsert({
            where: { email: 'officer2@delhipolice.gov.in' },
            update: {
                passwordHash: officerPassword,
                isActive: true,
            },
            create: {
                email: 'officer2@delhipolice.gov.in',
                phone: '9876543221',
                passwordHash: officerPassword,
                role: 'OFFICER',
                isActive: true,
            },
        });

        const officer2 = await prisma.beatOfficer.upsert({
            where: { badgeNumber: '28911777' },
            update: {
                name: 'Head Constable Priya Sharma',
            },
            create: {
                badgeNumber: '28911777',
                mobileNumber: '9876543221',
                name: 'Head Constable Priya Sharma',
                rank: 'Head Constable',
                policeStationId: policeStation.id,
                beatId: beat.id,
            },
        });

        await prisma.user.update({
            where: { id: officer2User.id },
            data: { officerId: officer2.id }
        });
        console.log('✅ Beat Officer 2 created - Badge:', officer2.badgeNumber);

        // 6. Create Citizen 1
        console.log('\nCreating Citizen 1...');
        const citizen1User = await prisma.user.upsert({
            where: { phone: '9876543230' },
            update: {
                passwordHash: citizenPassword,
                isActive: true,
            },
            create: {
                email: 'citizen1@test.com',
                phone: '9876543230',
                passwordHash: citizenPassword,
                role: 'CITIZEN',
                isActive: true,
            },
        });

        const citizen1 = await prisma.seniorCitizen.upsert({
            where: { mobileNumber: '9876543230' },
            update: {
                fullName: 'Mr. Ram Prasad',
            },
            create: {
                userId: citizen1User.id,
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
        console.log('✅ Citizen 1 created:', citizen1.fullName);

        // 7. Create Citizen 2
        console.log('\nCreating Citizen 2...');
        const citizen2User = await prisma.user.upsert({
            where: { phone: '9876543231' },
            update: {
                passwordHash: citizenPassword,
                isActive: true,
            },
            create: {
                email: 'citizen2@test.com',
                phone: '9876543231',
                passwordHash: citizenPassword,
                role: 'CITIZEN',
                isActive: true,
            },
        });

        const citizen2 = await prisma.seniorCitizen.upsert({
            where: { mobileNumber: '9876543231' },
            update: {
                fullName: 'Mrs. Kamla Devi',
            },
            create: {
                userId: citizen2User.id,
                fullName: 'Mrs. Kamla Devi',

                mobileNumber: '9876543231',
                aadhaarNumber: '234567890123',
                dateOfBirth: new Date('1956-03-20'),
                age: 69,
                gender: 'Female',
                permanentAddress: 'Karol Bagh, New Delhi',
                pinCode: '110005',
                status: 'VERIFIED',
                idVerificationStatus: 'Verified',
                districtId: district.id,
                policeStationId: policeStation.id,
                beatId: beat.id,
            },
        });
        console.log('✅ Citizen 2 created:', citizen2.fullName);

        console.log('\n🎉 Test users seeded successfully!\n');
        console.log('═══════════════════════════════════════════════');
        console.log('📋 TEST CREDENTIALS SUMMARY');
        console.log('═══════════════════════════════════════════════');
        console.log('\n👨‍💼 ADMIN:');
        console.log('   Email: admin@delhipolice.gov.in');
        console.log('   Phone: 9876543210');
        console.log('   Password: Admin@123');
        console.log('\n👮 BEAT OFFICER 1:');
        console.log('   PIS: DL001234');
        console.log('   Phone: 9876543220');
        console.log('   Password: Officer@123');
        console.log('\n👮 BEAT OFFICER 2:');
        console.log('   PIS: DL001235');
        console.log('   Phone: 9876543221');
        console.log('   Password: Officer@123');
        console.log('\n👴 CITIZEN 1:');
        console.log('   Phone: 9876543230');
        console.log('   Password: Citizen@123');
        console.log('\n👵 CITIZEN 2:');
        console.log('   Phone: 9876543231');
        console.log('   Password: Citizen@123');
        console.log('\n═══════════════════════════════════════════════');
        console.log('🧪 TEST OTP: 123456 (for development)');
        console.log('═══════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error seeding test users:', error);
        throw error;
    }
}

seedTestUsers()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
