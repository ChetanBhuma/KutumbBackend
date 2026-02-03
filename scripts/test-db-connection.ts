import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing Supabase connection...\n');

  try {
    // Try a simple query
    const count = await prisma.user.count();
    console.log(`✅ Connection successful!`);
    console.log(`   Found ${count} users in database`);

    // Test a few more tables
    const rangeCount = await prisma.range.count();
    const citizenCount = await prisma.seniorCitizen.count();

    console.log(`   Found ${rangeCount} ranges`);
    console.log(`   Found ${citizenCount} senior citizens`);

    return true;
  } catch (error: any) {
    console.error(`❌ Connection failed:`, error.message);
    return false;
  }
}

testConnection()
  .finally(async () => {
    await prisma.$disconnect();
  });
