import { PrismaClient } from '@prisma/client';
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function importData(backupFile?: string) {
  console.log('🔄 Starting Neon data import...\n');

  // Find the most recent backup file if not specified
  let backupPath: string;
  if (backupFile) {
    backupPath = backupFile;
  } else {
    const backupDir = path.join(__dirname, '../../backup');
    const files = await fs.readdir(backupDir);
    const exportFiles = files
      .filter((f: string) => f.startsWith('supabase-export-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (exportFiles.length === 0) {
      throw new Error('No backup files found. Please run export-from-supabase.ts first.');
    }

    backupPath = path.join(backupDir, exportFiles[0]);
    console.log(`📂 Using most recent backup: ${exportFiles[0]}\n`);
  }

  // Read backup file
  console.log(`📖 Reading backup from: ${backupPath}`);
  const data = JSON.parse(await fs.readFile(backupPath, 'utf-8'));

  // Import order (same as export order - maintains foreign key integrity)
  const tables = [
    'Range',
    'HealthCondition',
    'LivingArrangement',
    'MaritalStatus',
    'RiskFactor',
    'VisitType',
    'PermissionCategory',
    'District',
    'SubDivision',
    'PoliceStation',
    'Beat',
    'Role',
    'Permission',
    'Designation',
    'SystemMaster',
    'VulnerabilityConfig',
    'User',
    'BeatOfficer',
    'SeniorCitizen',
    'SpouseDetails',
    'FamilyMember',
    'EmergencyContact',
    'Document',
    'HouseholdHelp',
    'MedicalHistory',
    'Visit',
    'VisitFeedback',
    'VisitRequest',
    'ServiceRequest',
    'SOSAlert',
    'SOSLocationUpdate',
    'VulnerabilityHistory',
    'AuditLog',
    'OfficerLeave',
    'OfficerTransferHistory',
    'CitizenRegistration',
    'CitizenAuth',
    'VerificationRequest',
    'Notification',
    'Session',
  ];

  let totalImported = 0;
  const errors: string[] = [];

  console.log('\n📥 Importing data...\n');

  for (const table of tables) {
    const records = data[table];

    if (!records || records.length === 0) {
      console.log(`⏭️  ${table.padEnd(25)} No data to import`);
      continue;
    }

    try {
      // @ts-ignore - Dynamic model access
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      const model = (prisma as any)[modelName];

      if (model) {
        // Use createMany for bulk import
        await model.createMany({
          data: records,
          skipDuplicates: true,
        });

        totalImported += records.length;
        console.log(`✅ ${table.padEnd(25)} ${records.length.toString().padStart(6)} records imported`);
      } else {
        const errorMsg = `Model ${table} not found`;
        errors.push(errorMsg);
        console.log(`❌ ${table.padEnd(25)} ${errorMsg}`);
      }
    } catch (e: any) {
      const errorMsg = e.message.slice(0, 100);
      errors.push(`${table}: ${errorMsg}`);
      console.error(`❌ ${table.padEnd(25)} Error: ${errorMsg}`);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   Total records imported: ${totalImported}`);
  console.log(`   Tables processed: ${tables.length}`);
  console.log(`   Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log(`\n✅ Import complete!`);
}

// Get backup file from command line argument if provided
const backupFile = process.argv[2];

importData(backupFile)
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
