import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAllUsers() {
    console.log('🌱 Starting comprehensive database seed...\\n');

    try {
        // Hash password function
        const hashPassword = async (password: string) => {
            return await bcrypt.hash(password, 10);
        };

        // ========================================
        // 1. SUPER ADMIN
        // ========================================
        console.log('👑 Creating Super Admin...');
        const superAdminPassword = await hashPassword('Admin@123');

        const superAdmin = await prisma.user.upsert({
            where: { email: 'admin@delhipolice.gov.in' },
            update: {
                passwordHash: superAdminPassword,
                phone: '9876543210',
            },
            create: {
                email: 'admin@delhipolice.gov.in',
                phone: '9876543210',
                passwordHash: superAdminPassword,
                role: 'SUPER_ADMIN',
                name: 'Super Administrator',
                isActive: true,
            },
        });
        console.log(`✅ Super Admin: ${superAdmin.email}\\n`);

        // ========================================
        // 2. DISTRICT ADMIN
        // ========================================
        console.log('🏛️ Creating District Admin...');
        const districtAdminPassword = await hashPassword('Admin@123');

        const districtAdmin = await prisma.user.upsert({
            where: { email: 'district.admin@delhipolice.gov.in' },
            update: {
                passwordHash: districtAdminPassword,
                phone: '9876543211',
            },
            create: {
                email: 'district.admin@delhipolice.gov.in',
                phone: '9876543211',
                passwordHash: districtAdminPassword,
                role: 'ADMIN',
                name: 'District Administrator',
                isActive: true,
            },
        });
        console.log(`✅ District Admin: ${districtAdmin.email}\\n`);

        // ========================================
        // 3. GET OR CREATE MASTER DATA
        // ========================================
        console.log('📊 Setting up master data...');

        // Get or create District
        const district = await prisma.district.upsert({
            where: { code: 'DL-CENTRAL' },
            update: {},
            create: {
                code: 'DL-CENTRAL',
                name: 'Central District',
                range: 'Central Range',
                isActive: true,
            },
        });

        // Get or create Police Station
        const policeStation = await prisma.policeStation.upsert({
            where: { code: 'PS-CP' },
            update: {},
            create: {
                code: 'PS-CP',
                name: 'Connaught Place Police Station',
                districtId: district.id,
                address: 'Connaught Place, New Delhi',
                contactNumber: '011-23412345',
                isActive: true,
            },
        });

        // Get or create Beat
        const beat = await prisma.beat.upsert({
            where: { code: 'BEAT-CP-1' },
            update: {},
            create: {
                code: 'BEAT-CP-1',
                name: 'CP Beat 1',
                policeStationId: policeStation.id,
                isActive: true,
            },
        });

        console.log(`✅ Master Data: ${district.name} > ${policeStation.name} > ${beat.name}\\n`);

        // ========================================
        // 4. OFFICERS (with real PIS numbers)
        // ========================================
        console.log('👮 Creating Officers...');
        const officerPassword = await hashPassword('Officer@123');

        const officers = [
            {
                name: 'Constable Rajesh Kumar',
                email: 'officer1@delhipolice.gov.in',
                phone: '9876543220',
                pisNumber: '28120039',
                badgeNumber: '28120039',
                rank: 'Constable',
            },
            {
                name: 'Head Constable Priya Sharma',
                email: 'officer2@delhipolice.gov.in',
                phone: '9876543221',
                pisNumber: '28911777',
                badgeNumber: '28911777',
                rank: 'Head Constable',
            },
            {
                name: 'Sub-Inspector Amit Singh',
                email: 'officer3@delhipolice.gov.in',
                phone: '9876543222',
                pisNumber: '16970205',
                badgeNumber: '16970205',
                rank: 'Sub-Inspector',
            },
        ];

        for (const officer of officers) {
            // Create User
            const user = await prisma.user.upsert({
                where: { email: officer.email },
                update: {
                    passwordHash: officerPassword,
                    phone: officer.phone,
                },
                create: {
                    email: officer.email,
                    phone: officer.phone,
                    passwordHash: officerPassword,
                    role: 'OFFICER',
                    name: officer.name,
                    isActive: true,
                },
            });

            // Create BeatOfficer
            await prisma.beatOfficer.upsert({
                where: { badgeNumber: officer.badgeNumber },
                update: {
                    name: officer.name,
                    pisNumber: officer.pisNumber,
                },
                create: {
                    userId: user.id,
                    name: officer.name,
                    badgeNumber: officer.badgeNumber,
                    pisNumber: officer.pisNumber,
                    rank: officer.rank,
                    policeStationId: policeStation.id,
                    beatId: beat.id,
                    contactNumber: officer.phone,
                    isActive: true,
                },
            });

            console.log(`✅ Officer: ${officer.name} (PIS: ${officer.pisNumber})`);
        }
        console.log();

        // ========================================
        // 5. CITIZENS
        // ========================================
        console.log('👴 Creating Citizens...');
        const citizenPassword = await hashPassword('Citizen@123');

        const citizens = [
            {
                name: 'Mr. Ram Prasad',
                email: 'citizen1@test.com',
                phone: '9876543230',
                gender: 'Male',
                age: 72,
                dob: new Date('1952-03-15'),
                address: 'House No. 45, Sector 12, Rajouri Garden',
            },
            {
                name: 'Mrs. Kamla Devi',
                email: 'citizen2@test.com',
                phone: '9876543231',
                gender: 'Female',
                age: 68,
                dob: new Date('1956-07-22'),
                address: 'Flat 302, Sunshine Apartments, Pitampura',
            },
        ];

        for (const citizen of citizens) {
            // Create User
            const user = await prisma.user.upsert({
                where: { email: citizen.email },
                update: {
                    passwordHash: citizenPassword,
                    phone: citizen.phone,
                },
                create: {
                    email: citizen.email,
                    phone: citizen.phone,
                    passwordHash: citizenPassword,
                    role: 'CITIZEN',
                    name: citizen.name,
                    isActive: true,
                },
            });

            // Create SeniorCitizen
            await prisma.seniorCitizen.upsert({
                where: { mobileNumber: citizen.phone },
                update: {
                    fullName: citizen.name,
                },
                create: {
                    userId: user.id,
                    fullName: citizen.name,
                    mobileNumber: citizen.phone,
                    gender: citizen.gender,
                    age: citizen.age,
                    dateOfBirth: citizen.dob,
                    permanentAddress: citizen.address,
                    pinCode: '110001',
                    status: 'VERIFIED',
                    idVerificationStatus: 'Verified',
                    districtId: district.id,
                    policeStationId: policeStation.id,
                    beatId: beat.id,
                },
            });

            console.log(`✅ Citizen: ${citizen.name} (${citizen.phone})`);
        }
        console.log();

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\\n📊 Seed Summary:');
        console.log('=====================================');
        console.log(`✅ Super Admin: 1`);
        console.log(`✅ District Admin: 1`);
        console.log(`✅ Officers: ${officers.length} (with real PIS numbers)`);
        console.log(`✅ Citizens: ${citizens.length}`);
        console.log(`✅ Districts: 1`);
        console.log(`✅ Police Stations: 1`);
        console.log(`✅ Beats: 1`);
        console.log('=====================================');
        console.log('\\n🎉 Database seeded successfully!');
        console.log('\\n📝 Check TEST_CREDENTIALS.md for login details\\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
seedAllUsers()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
