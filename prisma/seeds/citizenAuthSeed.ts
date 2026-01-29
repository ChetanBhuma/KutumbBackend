import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedCitizenAuth() {
    console.log('👤 Seeding Citizen Auth Account...');

    const mobileNumber = '9876543215';
    const password = 'Test@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create citizen auth account
    const citizenAuth = await prisma.citizenAuth.upsert({
        where: { mobileNumber },
        update: {
            password: hashedPassword,
            isVerified: true,
            registrationStep: 2, // Password created
        },
        create: {
            mobileNumber,
            password: hashedPassword,
            isVerified: true,
            registrationStep: 2,
        },
    });

    console.log('✅ Created citizen auth account:');
    console.log(`   Mobile: ${mobileNumber}`);
    console.log(`   Password: ${password}`);
    console.log(`   Status: Verified and ready to login`);
    console.log(`   Login at: http://localhost:3000/citizen/login`);
}

seedCitizenAuth()
    .catch((e) => {
        console.error('Error seeding citizen auth:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
