
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'admin@delhipolice.gov.in';
    const newPassword = 'admin123';

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });

    console.log(`Password for ${updatedUser.email} has been reset successfully.`);
    console.log(`New password hash: ${updatedUser.passwordHash}`);

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
