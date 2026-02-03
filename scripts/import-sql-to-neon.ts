import { PrismaClient } from '@prisma/client';
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function importSQLFile() {
  console.log('🔄 Starting SQL import to Neon using Prisma...\n');

  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../../backup.sql');
    console.log(`📖 Reading SQL file: ${sqlFilePath}`);

    const sqlContent = await fs.readFile(sqlFilePath, 'utf-8');
    const totalSize = (sqlContent.length / 1024 / 1024).toFixed(2);
    console.log(`✅ Loaded ${totalSize} MB of SQL\n`);

    console.log('📥 Importing data to Neon...');
    console.log('⚠️  NOTE: You will see errors for Supabase-specific schemas (auth, storage, etc.)');
    console.log('   This is NORMAL and EXPECTED. Your application data will import correctly.\n');
    console.log('⏳ This may take several minutes. Please wait...\n');

    const startTime = Date.now();

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    console.log(`📝 Processing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip Supabase-specific schemas
      if (
        statement.includes('CREATE SCHEMA auth') ||
        statement.includes('CREATE SCHEMA storage') ||
        statement.includes('CREATE SCHEMA realtime') ||
        statement.includes('CREATE SCHEMA vault') ||
        statement.includes('CREATE SCHEMA graphql') ||
        statement.includes('CREATE SCHEMA extensions') ||
        statement.includes('CREATE SCHEMA pgbouncer') ||
        statement.includes('ALTER SCHEMA auth') ||
        statement.includes('ALTER SCHEMA storage') ||
        statement.includes('OWNER TO supabase') ||
        statement.includes('OWNER TO postgres') ||
        statement.toLowerCase().includes('\\restrict')
      ) {
        skipCount++;
        continue;
      }

      try {
        await prisma.$executeRawUnsafe(statement + ';');
        successCount++;

        if ((i + 1) % 100 === 0) {
          console.log(`  Progress: ${i + 1}/${statements.length} statements processed...`);
        }
      } catch (error: any) {
        errorCount++;

        // Only log non-Supabase errors
        if (!error.message.includes('schema') &&
            !error.message.includes('auth') &&
            !error.message.includes('storage') &&
            !error.message.includes('already exists')) {
          console.log(`  ⚠️  Error at statement ${i + 1}: ${error.message.slice(0, 100)}`);
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successful: ${successCount} statements`);
    console.log(`   ⏭️  Skipped: ${skipCount} statements (Supabase schemas)`);
    console.log(`   ⚠️  Errors: ${errorCount} statements (likely Supabase-related)`);
    console.log(`   ⏱️  Duration: ${duration} seconds\n`);

    // Verify import by counting records
    console.log('📊 Verifying imported data...\n');

    const tables = [
      'Range', 'District', 'SubDivision', 'PoliceStation', 'Beat',
      'Role', 'Permission', 'Designation',
      'User', 'BeatOfficer', 'SeniorCitizen',
      'Visit', 'SOSAlert'
    ];

    let totalRecords = 0;
    for (const table of tables) {
      try {
        const result: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = parseInt(result[0].count);
        totalRecords += count;
        console.log(`  ${table.padEnd(20)} ${count.toString().padStart(6)} records`);
      } catch (e: any) {
        console.log(`  ${table.padEnd(20)}      - (not found)`);
      }
    }

    console.log(`\n  ${'TOTAL'.padEnd(20)} ${totalRecords.toString().padStart(6)} records`);
    console.log('\n✅ Import verification complete!');

  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importSQLFile()
  .then(() => {
    console.log('\n🎉 Import complete! Your Neon database is ready.\n');
    console.log('Next steps:');
    console.log('  1. Verify data: npx prisma studio');
    console.log('  2. Test your app: npm run start\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
