import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('Verifying Supabase Data via Backend Client...');
  try {
      // Check Key Tables
      const citizenCount = await prisma.seniorCitizen.count();
      console.log(`Senior Citizens: ${citizenCount}`);

      const stationCount = await prisma.policeStation.count();
      console.log(`Police Stations: ${stationCount}`);

      const userCount = await prisma.user.count();
      console.log(`Users: ${userCount}`);

      const roleCount = await prisma.role.count();
      console.log(`Roles: ${roleCount}`);

      const beatCount = await prisma.beat.count();
      console.log(`Beats: ${beatCount}`);

      console.log('Verification SUCCESS: Connected and fetched data.');
  } catch (e) {
      console.error('Verification FAILED:', e);
      process.exit(1);
  } finally {
      await prisma.$disconnect();
  }
}

verify();
