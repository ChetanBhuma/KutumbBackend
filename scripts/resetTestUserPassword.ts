import prisma from '../src/config/prisma';
import { PasswordService } from '../src/services/passwordService';

async function resetPassword() {
    const email = 'test.acp.1767600008750@delhipolice.gov.in';
    const newPassword = 'ChangeMe@123';

    try {
        console.log(`Resetting password for ${email}...`);
        const passwordHash = await PasswordService.hash(newPassword);

        await prisma.user.update({
            where: { email },
            data: { passwordHash }
        });

        console.log(`Success! Password set to: ${newPassword}`);
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
