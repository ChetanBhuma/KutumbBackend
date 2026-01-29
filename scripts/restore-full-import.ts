import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function restore() {
  console.log('Connecting to Supabase via Backend Prisma Client...');

  const backupPath = path.join(__dirname, '../../backup/full-data-snapshot.json');
  console.log(`Reading backup from ${backupPath}`);

  const data = JSON.parse(await fs.readFile(backupPath, 'utf-8'));

  // Restore Order (Topological Sort roughly)
  // Masters first, then core entities, then relations
  const tables = [
    'Range', 'District', 'SubDivision', 'PoliceStation', 'Beat',
    'Role', 'PermissionCategory', 'Permission',
    'Designation', 'SystemMaster', 'RiskFactor', 'VulnerabilityConfig',
    'User', 'BeatOfficer',
    'SeniorCitizen',
    'Visit', 'VisitType', 'VisitFeedback', 'VisitRequest',
    'SOSAlert', 'SOSLocationUpdate',
    'Document', 'EmergencyContact', 'FamilyMember', 'HouseholdHelp',
    'HealthCondition', 'LivingArrangement', 'MaritalStatus',
    'MedicalHistory', 'ServiceRequest', 'VulnerabilityHistory',
    'AuditLog', 'OfficerLeave', 'OfficerTransferHistory',
    'CitizenRegistration', 'CitizenAuth', 'VerificationRequest'
  ];

  for (const table of tables) {
      // @ts-ignore
      const records = data[table];
      if (records && records.length > 0) {
          console.log(`Restoring ${records.length} ${table} records...`);
          try {
              // @ts-ignore
              const model = prisma[table.charAt(0).toLowerCase() + table.slice(1)];

              if (model) {
                  // createMany is strictly better for bulk import
                  await model.createMany({
                      data: records,
                      skipDuplicates: true
                  });
                  console.log(`Restored ${table}.`);
              } else {
                  console.log(`Model ${table} not found.`);
              }
          } catch (e: any) {
              console.error(`Error restoring ${table}: ${e.message}`);
              // Fallback to individual? No, createMany is safest for foreign keys if ordered right.
              // If FK error, it means order is wrong or data missing.
              // We will try to continue.
          }
      }
  }

  console.log('Restore completed.');
}

restore()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
