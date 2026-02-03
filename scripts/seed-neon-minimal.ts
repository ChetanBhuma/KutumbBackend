import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding minimal data for production...\n');

    try {
        // Create Superadmin Role
        const superadminRole = await prisma.role.upsert({
            where: { name: 'SUPER_ADMIN' },
            update: {},
            create: {
                name: 'SUPER_ADMIN',
                displayName: 'Super Administrator',
                description: 'Full system access',
                jurisdictionLevel: 'CITY',
                isActive: true,
            },
        });
        console.log('✅ Created SUPER_ADMIN role');

        // Create Superadmin User
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const superadmin = await prisma.user.upsert({
            where: { email: 'superadmin@delhipolice.gov.in' },
            update: {},
            create: {
                email: 'superadmin@delhipolice.gov.in',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                phone: '9999999999',
                roleId: superadminRole.id,
                isActive: true,
                emailVerified: true,
            },
        });
        console.log('✅ Created superadmin user');
        console.log(`   Email: superadmin@delhipolice.gov.in`);
        console.log(`   Password: Admin@123\n`);

        console.log('🎉 Minimal seed complete!');
    } catch (error) {
        console.error('❌ Error seeding:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
