import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
    console.log('👥 Seeding Users...');

    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Admin@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const demoUsers = [
        {
            email: 'superadmin@delhipolice.gov.in',
            phone: '9999999999',
            role: 'SUPER_ADMIN',
        },
        {
            email: 'admin@delhipolice.gov.in',
            phone: '9876543210',
            role: 'ADMIN',
        },
        {
            email: 'officer-range@delhipolice.gov.in',
            phone: '9876543211',
            role: 'OFFICER',
        },
        {
            email: 'officer-sho@delhipolice.gov.in',
            phone: '9876543212',
            role: 'OFFICER',
        },
        {
            email: 'viewer@delhipolice.gov.in',
            phone: '9876543213',
            role: 'VIEWER',
        },
        {
            email: 'citizen@kutumb.in',
            phone: '9876543214',
            role: 'CITIZEN',
        },
    ];

    for (const user of demoUsers) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                phone: user.phone,
                role: user.role,
                passwordHash,
                isActive: true,
            },
            create: {
                email: user.email,
                phone: user.phone,
                role: user.role,
                passwordHash,
                isActive: true,
            },
        });
    }

    console.log(`✅ Created ${demoUsers.length} demo users. OTP login available, fallback password: ${defaultPassword}`);
}

seedUsers()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
