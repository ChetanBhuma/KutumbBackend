import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
  console.log('Connecting to database via Backend Prisma Client...');

  const data: any = {};

  // List of all models in the backend schema order
  const tables = [
    'Range', 'District', 'SubDivision', 'PoliceStation', 'Beat',
    'Role', 'PermissionCategory', 'Permission',
    'Designation', 'SystemMaster', 'RiskFactor', 'VulnerabilityConfig',
    'User', 'BeatOfficer',
    'SeniorCitizen',
    'Visit', 'VisitType', 'VisitFeedback', 'VisitRequest',
    // ... add all other models
    'SOSAlert', 'SOSLocationUpdate',
    'Document', 'EmergencyContact', 'FamilyMember', 'HouseholdHelp',
    'HealthCondition', 'LivingArrangement', 'MaritalStatus',
    'MedicalHistory', 'ServiceRequest', 'VulnerabilityHistory',
    'AuditLog', 'OfficerLeave', 'OfficerTransferHistory',
    'CitizenRegistration', 'CitizenAuth', 'VerificationRequest'
  ];

  for (const table of tables) {
      try {
          // @ts-ignore
          const model = prisma[table.charAt(0).toLowerCase() + table.slice(1)];
          if (model) {
              const records = await model.findMany();
              data[table] = records;
              console.log(`Backed up ${records.length} ${table} records`);
          } else {
             console.log(`Model ${table} not found on client.`);
          }
      } catch (e: any) {
          console.error(`Failed to backup ${table}: ${e.message}`);
      }
  }

  const backupPath = path.join(__dirname, '../../backup/full-data-snapshot.json');
  // Ensure dir exists
  await fs.mkdir(path.dirname(backupPath), { recursive: true });

  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
  console.log(`Backup written to ${backupPath}`);
}

backup()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
