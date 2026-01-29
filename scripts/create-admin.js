const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        // Create admin user
        // Create or update admin user
        const admin = await prisma.user.upsert({
            where: { email: 'admin@delhipolice.gov.in' },
            update: {
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN',
                isActive: true,
                name: 'Super Admin',
                phone: '9999999999',
            },
            create: {
                email: 'admin@delhipolice.gov.in',
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN',
                isActive: true,
                name: 'Super Admin',
                phone: '9999999999',
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email:', admin.email);
        console.log('Password: Admin@123');
        console.log('Role:', admin.role);
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('⚠️  Admin user already exists!');
        } else {
            console.error('❌ Error creating admin:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
