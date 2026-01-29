
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@delhipolice.gov.in' }
    });

    if (!user) {
      console.log('User "admin@delhipolice.gov.in" not found.');
      return;
    }

    console.log(`User Found: ${user.fullName} (${user.id})`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Is Active: ${user.isActive}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
