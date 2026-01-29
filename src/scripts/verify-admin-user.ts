import { prisma } from '../config/database';

async function verifyAdmin() {
    try {
        const adminEmail = 'admin@delhipolice.gov.in';
        const user = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!user) {
            console.log(` User ${adminEmail} NOT FOUND in database.`);
        } else {
            console.log(` User ${adminEmail} FOUND.`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Password Hash starts with: ${user.passwordHash.substring(0, 10)}...`);
        }
    } catch (error) {
        console.error('Error verifying admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAdmin();
