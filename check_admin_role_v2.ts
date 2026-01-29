
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@delhipolice.gov.in' },
      include: {
        officerProfile: true
      }
    });

    if (!user) {
      console.log('User "admin@delhipolice.gov.in" not found.');
      return;
    }

    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Is Active: ${user.isActive}`);

    if (user.officerProfile) {
        console.log(`Officer Name: ${user.officerProfile.name}`);
    } else {
        console.log("No linked Officer Profile.");
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminRole();
