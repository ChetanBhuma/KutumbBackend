import { PrismaClient } from '@prisma/client';
const fs = require('fs').promises;
const path = require('path');

// Use DIRECT_URL if available to avoid pooler circuit breaker
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function exportData() {
  console.log('🔄 Starting Supabase data export...\n');

  const data: any = {};
  let totalRecords = 0;

  // List of all models in dependency order (parents before children)
  const tables = [
    // Master data - no foreign keys
    'Range',
    'HealthCondition',
    'LivingArrangement',
    'MaritalStatus',
    'RiskFactor',
    'VisitType',
    'PermissionCategory',

    // Geographic hierarchy
    'District',
    'SubDivision',
    'PoliceStation',
    'Beat',

    // Roles and permissions
    'Role',
    'Permission',
    'Designation',

    // System masters
    'SystemMaster',
    'VulnerabilityConfig',

    // Users and officers
    'User',
    'BeatOfficer',

    // Citizens
    'SeniorCitizen',
    'SpouseDetails',
    'FamilyMember',
    'EmergencyContact',
    'Document',
    'HouseholdHelp',
    'MedicalHistory',

    // Visits and services
    'Visit',
    'VisitFeedback',
    'VisitRequest',
    'ServiceRequest',

    // SOS and alerts
    'SOSAlert',
    'SOSLocationUpdate',

    // Audit and history
    'VulnerabilityHistory',
    'AuditLog',
    'OfficerLeave',
    'OfficerTransferHistory',

    // Citizen portal
    'CitizenRegistration',
    'CitizenAuth',
    'VerificationRequest',
    'Notification',
    'Session',
  ];

  for (const table of tables) {
    try {
      // @ts-ignore - Dynamic model access
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      const model = (prisma as any)[modelName];

      if (model) {
        const records = await model.findMany();
        data[table] = records;
        totalRecords += records.length;
        console.log(`✅ ${table.padEnd(25)} ${records.length.toString().padStart(6)} records`);
      } else {
        console.log(`⚠️  ${table.padEnd(25)} Model not found, skipping`);
      }
    } catch (e: any) {
      console.error(`❌ ${table.padEnd(25)} Error: ${e.message}`);
    }
  }

  // Create backup directory if it doesn't exist
  const backupDir = path.join(__dirname, '../../backup');
  await fs.mkdir(backupDir, { recursive: true });

  // Generate timestamped filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupDir, `supabase-export-${timestamp}.json`);

  // Write backup file
  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));

  const stats = await fs.stat(backupPath);
  console.log(`\n📦 Export Summary:`);
  console.log(`   Total records: ${totalRecords}`);
  console.log(`   Tables exported: ${Object.keys(data).length}`);
  console.log(`   File location: ${backupPath}`);
  console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n✅ Export complete!`);

  return backupPath;
}

exportData()
  .catch((e) => {
    console.error('❌ Export failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
