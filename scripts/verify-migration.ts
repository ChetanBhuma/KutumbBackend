import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function verifyMigration() {
  console.log('📊 Verifying Neon Database Data...\n');

  const models = [
    'Range', 'District', 'SubDivision', 'PoliceStation', 'Beat',
    'Role', 'PermissionCategory', 'Permission',
    'User', 'BeatOfficer',
    'SeniorCitizen', 'Visit'
  ];

  const results: any[] = [];
  let totalRecords = 0;

  for (const model of models) {
    try {
      // @ts-ignore
      const count = await prisma[model.charAt(0).toLowerCase() + model.slice(1)].count();
      results.push({ model, count, status: '✅ OK' });
      totalRecords += count;
    } catch (e: any) {
      results.push({ model, count: '-', status: `❌ Error: ${e.message.split('\n')[0]}` });
    }
  }

  console.log('--------------------------------------------------');
  console.log('Model'.padEnd(25) + 'Count'.padEnd(10) + 'Status');
  console.log('--------------------------------------------------');

  for (const res of results) {
    console.log(
      res.model.padEnd(25) +
      res.count.toString().padEnd(10) +
      res.status
    );
  }
  console.log('--------------------------------------------------');
  console.log(`\nΣ Total Data Checks: ${totalRecords} records found across core tables.`);

  if (totalRecords === 0) {
    console.log('\n⚠️  WARNING: No data found! Migration might have failed.');
  } else {
    console.log('\n✅ Data present! Migration successful (partial or full).');
  }
}

verifyMigration()
  .finally(async () => {
    await prisma.$disconnect();
  });
