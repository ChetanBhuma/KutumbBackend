const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndFixOfficer() {
    try {
        const identifier = 'officer1@delhipolice.gov.in';
        console.log(`Checking user: ${identifier}`);

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { phone: identifier }]
            }
        });

        if (!user) {
            console.log('❌ User not found!');
            // Create user if missing?
            return;
        }

        console.log('✅ User found:', user.email, user.role);
        console.log('Current Hash:', user.passwordHash.substring(0, 10) + '...');

        const testPass = 'Officer@123';
        const isMatch = await bcrypt.compare(testPass, user.passwordHash);

        console.log(`Password '${testPass}' match?`, isMatch ? 'YES' : 'NO');

        if (!isMatch) {
            console.log('⚠️ Password mismatch. Resetting password...');
            const newHash = await bcrypt.hash(testPass, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: newHash }
            });
            console.log('✅ Password reset to:', testPass);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndFixOfficer();
