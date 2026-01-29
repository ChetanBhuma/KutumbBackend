import { PrismaClient, IdentityStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Dummy Senior Citizen...');

    const mobileNumber = '9988776655';
    const password = 'Password@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get a base location (District/PoliceStation/Beat) - using first ones found
    const district = await prisma.district.findFirst();
    const policeStation = await prisma.policeStation.findFirst({
        where: { districtId: district?.id }
    });
    const beat = await prisma.beat.findFirst({
        where: { policeStationId: policeStation?.id }
    });

    if (!district || !policeStation || !beat) {
        throw new Error('Base location data (District/PS/Beat) missing. Please run main seeds first.');
    }

    // 1. Create Senior Citizen
    const citizen = await prisma.seniorCitizen.upsert({
        where: { mobileNumber },
        update: {},
        create: {
            fullName: 'Dummy Senior Citizen',
            dateOfBirth: new Date('1950-01-01'),
            age: 75,
            gender: 'Male',
            mobileNumber,
            permanentAddress: '123, Dummy Lane, New Delhi',
            pinCode: '110001',
            districtId: district.id,
            policeStationId: policeStation.id,
            beatId: beat.id,
            vulnerabilityLevel: 'Low',
            idVerificationStatus: IdentityStatus.Verified,
            maritalStatus: 'Married',
            nationality: 'Indian',
            languagesKnown: ['Hindi', 'English'],
            consentDataUse: true,
            srCitizenUniqueId: 'SC-DUMMY-001',
            isActive: true,
            registeredOnApp: true
        }
    });

    // 2. Create Citizen Auth
    await prisma.citizenAuth.upsert({
        where: { mobileNumber },
        update: {
            password: hashedPassword,
            citizenId: citizen.id,
            isVerified: true
        },
        create: {
            mobileNumber,
            password: hashedPassword,
            citizenId: citizen.id,
            isVerified: true
        }
    });

    console.log('✅ Dummy Senior Citizen Created Successfully!');
    console.log('------------------------------------------');
    console.log(`Name:     ${(citizen as any).fullName}`);
    console.log(`Mobile:   ${mobileNumber}`);
    console.log(`Password: ${password}`);
    console.log('------------------------------------------');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding dummy citizen:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
