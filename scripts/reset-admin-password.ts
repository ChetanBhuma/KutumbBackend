/**
 * Create or Reset Admin User
 * Creates admin@delhipolice.gov.in if it doesn't exist, or resets password if it does
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createOrResetAdmin() {
    try {
        console.log('🔐 Creating/Resetting admin user...\n');

        const email = 'admin@delhipolice.gov.in';
        const phone = '9999999999';
        const newPassword = 'admin123';

        // Hash the password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Update existing user
            await prisma.user.update({
                where: { email },
                data: { passwordHash },
            });
            console.log(`✅ Password reset for existing user: ${email}`);
        } else {
            // Create new admin user
            await prisma.user.create({
                data: {
                    email,
                    phone,
                    passwordHash,
                    role: 'SUPER_ADMIN',
                    isActive: true,
                },
            });
            console.log(`✅ Created new admin user: ${email}`);
        }

        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Password: ${newPassword}`);
        console.log(`👤 Role: SUPER_ADMIN`);
        console.log('\n✨ You can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createOrResetAdmin()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
