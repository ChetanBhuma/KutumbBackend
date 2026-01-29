import { PrismaClient, IdentityStatus, RegistrationStatus, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Pending Registration Data...');

    // Get base location data
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

    const pendingCitizens = [
        {
            fullName: 'Amitabh Bachchan (Demo)',
            mobileNumber: '9111111111',
            status: IdentityStatus.Pending,
            regStatus: RegistrationStatus.PENDING_REVIEW
        },
        {
            fullName: 'Hema Malini (Demo)',
            mobileNumber: '9222222222',
            status: IdentityStatus.Pending,
            regStatus: RegistrationStatus.PENDING_REVIEW
        },
        {
            fullName: 'Dharmendra Singh (Demo)',
            mobileNumber: '9333333333',
            status: IdentityStatus.Pending,
            regStatus: RegistrationStatus.PENDING_REVIEW
        }
    ];

    for (const data of pendingCitizens) {
        console.log(`Processing: ${data.fullName}`);

        // 1. Create Senior Citizen with Pending status
        const citizen = await prisma.seniorCitizen.upsert({
            where: { mobileNumber: data.mobileNumber },
            update: {
                idVerificationStatus: data.status
            },
            create: {
                fullName: data.fullName,
                dateOfBirth: new Date('1945-10-11'),
                age: 79,
                gender: data.fullName.includes('Hema') ? 'Female' : 'Male',
                mobileNumber: data.mobileNumber,
                permanentAddress: 'Prateeksha, Juhu, Mumbai (Seeded for Delhi)',
                pinCode: '110001',
                districtId: district.id,
                policeStationId: policeStation.id,
                beatId: beat.id,
                idVerificationStatus: data.status,
                vulnerabilityLevel: 'Medium',
                isActive: true
            }
        });

        // 2. Create Citizen Registration record
        await prisma.citizenRegistration.upsert({
            where: { mobileNumber: data.mobileNumber },
            update: {
                status: data.regStatus,
                citizenId: citizen.id
            },
            create: {
                mobileNumber: data.mobileNumber,
                fullName: data.fullName,
                status: data.regStatus,
                registrationStep: 'COMPLETED',
                otpVerified: true,
                citizenId: citizen.id
            }
        });

        // 3. Create Verification Request
        await prisma.verificationRequest.create({
            data: {
                entityType: 'SeniorCitizen',
                entityId: citizen.id,
                seniorCitizenId: citizen.id,
                requestedBy: 'System-Seed',
                priority: 'High',
                status: VerificationStatus.PENDING,
                remarks: 'New registration awaiting manual verification.'
            }
        });
    }

    console.log('✅ Pending Registration Data Seeded Successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding pending data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
