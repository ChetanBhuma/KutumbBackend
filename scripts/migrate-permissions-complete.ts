import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ALL-IN-ONE Dynamic Permission System Migration
 *
 * This script handles the complete migration process:
 * 1. Backs up existing role permissions
 * 2. Creates permission categories and permissions
 * 3. Applies Prisma schema migration
 * 4. Links roles to new permissions
 * 5. Verifies the migration
 *
 * Run this script with: npm run migrate:permissions
 */

const prisma = new PrismaClient();

// ============================================
// PERMISSION DATA DEFINITIONS
// ============================================

interface CategoryData {
  code: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
}

interface PermissionData {
  code: string;
  name: string;
  description?: string;
  categoryCode: string;
  menuPath?: string;
  menuLabel?: string;
  menuIcon?: string;
  isMenuItem: boolean;
  displayOrder: number;
  parentCode?: string;
}

const categories: CategoryData[] = [
  { code: 'dashboard', name: 'Dashboard', description: 'Dashboard access permissions', icon: 'Home', displayOrder: 1 },
  { code: 'citizens', name: 'Citizens', description: 'Citizen management permissions', icon: 'Users', displayOrder: 2 },
  { code: 'visits', name: 'Visits', description: 'Visit management permissions', icon: 'ClipboardList', displayOrder: 3 },
  { code: 'operations', name: 'Operations', description: 'Operational permissions', icon: 'Shield', displayOrder: 4 },
  { code: 'personnel', name: 'Personnel', description: 'Personnel management permissions', icon: 'Users', displayOrder: 5 },
  { code: 'analytics', name: 'Analytics', description: 'Analytics and reporting permissions', icon: 'BarChart3', displayOrder: 6 },
  { code: 'admin', name: 'Admin', description: 'Administrative permissions', icon: 'Shield', displayOrder: 7 },
  { code: 'system', name: 'System', description: 'System configuration permissions', icon: 'Settings', displayOrder: 8 },
  { code: 'self_service', name: 'Self Service', description: 'Citizen self-service permissions', icon: 'User', displayOrder: 9 }
];

const permissions: PermissionData[] = [
  // Dashboard
  { code: 'dashboard.admin.view', name: 'View Admin Dashboard', categoryCode: 'dashboard', menuPath: '/admin/dashboard', menuLabel: 'Dashboard', menuIcon: 'Home', isMenuItem: true, displayOrder: 1 },
  { code: 'dashboard.officer.view', name: 'View Officer Dashboard', categoryCode: 'dashboard', menuPath: '/officer-app/dashboard', menuLabel: 'Officer Dashboard', menuIcon: 'Shield', isMenuItem: true, displayOrder: 2 },
  { code: 'dashboard.citizen.view', name: 'View Citizen Dashboard', categoryCode: 'dashboard', menuPath: '/citizen-portal/dashboard', menuLabel: 'Citizen Dashboard', menuIcon: 'User', isMenuItem: true, displayOrder: 3 },

  // Citizens
  { code: 'citizens.read', name: 'View Citizens', categoryCode: 'citizens', menuPath: '/citizens', menuLabel: 'Citizens', menuIcon: 'Users', isMenuItem: true, displayOrder: 1 },
  { code: 'citizens.write', name: 'Manage Citizens', categoryCode: 'citizens', isMenuItem: false, displayOrder: 2 },
  { code: 'citizens.delete', name: 'Delete Citizens', categoryCode: 'citizens', isMenuItem: false, displayOrder: 3 },
  { code: 'citizens.approve', name: 'Approve Registrations', categoryCode: 'citizens', menuPath: '/approvals', menuLabel: 'Registration Approvals', menuIcon: 'FileCheck', isMenuItem: true, displayOrder: 4 },
  { code: 'citizens.map', name: 'Citizen Map', categoryCode: 'citizens', menuLabel: 'Citizen Map', menuIcon: 'Map', isMenuItem: true, displayOrder: 5 },
  { code: 'citizens.map.all', name: 'All Citizens Map', categoryCode: 'citizens', menuPath: '/citizens/map', menuLabel: 'All Citizens', menuIcon: 'MapPin', isMenuItem: true, displayOrder: 1, parentCode: 'citizens.map' },
  { code: 'citizens.map.pending', name: 'Pending Verification Map', categoryCode: 'citizens', menuPath: '/citizens/map/pending', menuLabel: 'Pending Verification', menuIcon: 'AlertTriangle', isMenuItem: true, displayOrder: 2, parentCode: 'citizens.map' },

  // Visits
  { code: 'visits.read', name: 'View Visits', categoryCode: 'visits', menuPath: '/visits', menuLabel: 'Visits', menuIcon: 'ClipboardList', isMenuItem: true, displayOrder: 1 },
  { code: 'visits.schedule', name: 'Schedule Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 2 },
  { code: 'visits.complete', name: 'Complete Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 3 },
  { code: 'visits.delete', name: 'Delete Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 4 },

  // Operations
  { code: 'operations', name: 'Operations', categoryCode: 'operations', menuLabel: 'Operations', menuIcon: 'Shield', isMenuItem: true, displayOrder: 1 },
  { code: 'operations.jurisdiction', name: 'Jurisdiction Map', categoryCode: 'operations', menuPath: '/maps', menuLabel: 'Jurisdiction Map', menuIcon: 'MapPin', isMenuItem: true, displayOrder: 1, parentCode: 'operations' },
  { code: 'sos.read', name: 'View SOS Alerts', categoryCode: 'operations', menuPath: '/sos', menuLabel: 'SOS Alerts', menuIcon: 'Siren', isMenuItem: true, displayOrder: 2, parentCode: 'operations' },
  { code: 'sos.respond', name: 'Respond to SOS', categoryCode: 'operations', isMenuItem: false, displayOrder: 3 },
  { code: 'sos.resolve', name: 'Resolve SOS', categoryCode: 'operations', isMenuItem: false, displayOrder: 4 },
  { code: 'operations.roster', name: 'Duty Roster', categoryCode: 'operations', menuPath: '/roster', menuLabel: 'Duty Roster', menuIcon: 'CalendarDays', isMenuItem: true, displayOrder: 5, parentCode: 'operations' },

  // Personnel
  { code: 'personnel', name: 'Personnel', categoryCode: 'personnel', menuLabel: 'Personnel', menuIcon: 'Users', isMenuItem: true, displayOrder: 1 },
  { code: 'officers.read', name: 'View Officers', categoryCode: 'personnel', menuPath: '/officers', menuLabel: 'Officers', menuIcon: 'UserCog', isMenuItem: true, displayOrder: 1, parentCode: 'personnel' },
  { code: 'officers.write', name: 'Manage Officers', categoryCode: 'personnel', isMenuItem: false, displayOrder: 2 },
  { code: 'officers.delete', name: 'Delete Officers', categoryCode: 'personnel', isMenuItem: false, displayOrder: 3 },
  { code: 'officers.manage', name: 'Full Officer Management', categoryCode: 'personnel', isMenuItem: false, displayOrder: 4 },
  { code: 'personnel.hierarchy', name: 'View Hierarchy', categoryCode: 'personnel', menuPath: '/hierarchy', menuLabel: 'Hierarchy', menuIcon: 'GitGraph', isMenuItem: true, displayOrder: 5, parentCode: 'personnel' },

  // Analytics
  { code: 'analytics', name: 'Analytics', categoryCode: 'analytics', menuLabel: 'Analytics', menuIcon: 'BarChart3', isMenuItem: true, displayOrder: 1 },
  { code: 'reports.read', name: 'View Reports', categoryCode: 'analytics', menuPath: '/reports', menuLabel: 'Reports', menuIcon: 'FileBarChart', isMenuItem: true, displayOrder: 1, parentCode: 'analytics' },
  { code: 'reports.generate', name: 'Generate Reports', categoryCode: 'analytics', isMenuItem: false, displayOrder: 2 },
  { code: 'reports.export', name: 'Export Reports', categoryCode: 'analytics', isMenuItem: false, displayOrder: 3 },
  { code: 'analytics.dashboard', name: 'Analytics Dashboard', categoryCode: 'analytics', menuPath: '/analytics', menuLabel: 'Analytics', menuIcon: 'BarChart3', isMenuItem: true, displayOrder: 4, parentCode: 'analytics' },

  // Admin
  { code: 'admin', name: 'Admin', categoryCode: 'admin', menuLabel: 'Admin', menuIcon: 'Shield', isMenuItem: true, displayOrder: 1 },
  { code: 'admin.users', name: 'Manage Users', categoryCode: 'admin', menuPath: '/users', menuLabel: 'Users', menuIcon: 'Users', isMenuItem: true, displayOrder: 1, parentCode: 'admin' },
  { code: 'admin.roles', name: 'Manage Roles', categoryCode: 'admin', menuPath: '/admin/masters/roles', menuLabel: 'Roles', menuIcon: 'Shield', isMenuItem: true, displayOrder: 2, parentCode: 'admin' },
  { code: 'admin.permissions', name: 'Manage Permissions', categoryCode: 'admin', menuPath: '/admin/masters/permissions', menuLabel: 'Permissions', menuIcon: 'Key', isMenuItem: true, displayOrder: 3, parentCode: 'admin' },
  { code: 'admin.masters', name: 'Manage Masters', categoryCode: 'admin', menuPath: '/admin/masters', menuLabel: 'Masters', menuIcon: 'Database', isMenuItem: true, displayOrder: 4, parentCode: 'admin' },
  { code: 'notifications.manage', name: 'Manage Notifications', categoryCode: 'admin', menuPath: '/notifications', menuLabel: 'Notifications', menuIcon: 'Bell', isMenuItem: true, displayOrder: 5, parentCode: 'admin' },

  // System
  { code: 'system', name: 'System', categoryCode: 'system', menuLabel: 'System', menuIcon: 'Settings', isMenuItem: true, displayOrder: 1 },
  { code: 'system.settings', name: 'System Configuration', categoryCode: 'system', menuPath: '/settings', menuLabel: 'Config', menuIcon: 'Settings', isMenuItem: true, displayOrder: 1, parentCode: 'system' },
  { code: 'audit.logs', name: 'View Audit Logs', categoryCode: 'system', menuPath: '/audit', menuLabel: 'Audit', menuIcon: 'History', isMenuItem: true, displayOrder: 2, parentCode: 'system' },
  { code: 'system.backups', name: 'Manage Backups', categoryCode: 'system', menuPath: '/settings?tab=database', menuLabel: 'Backups', menuIcon: 'Database', isMenuItem: true, displayOrder: 3, parentCode: 'system' },

  // Self-Service (Citizen Portal)
  { code: 'profile.read.own', name: 'View Own Profile', categoryCode: 'self_service', isMenuItem: false, displayOrder: 1 },
  { code: 'profile.update.own', name: 'Update Own Profile', categoryCode: 'self_service', isMenuItem: false, displayOrder: 2 },
  { code: 'visits.read.own', name: 'View Own Visits', categoryCode: 'self_service', isMenuItem: false, displayOrder: 3 },
  { code: 'visits.request', name: 'Request Visits', categoryCode: 'self_service', isMenuItem: false, displayOrder: 4 },
  { code: 'sos.create', name: 'Create SOS Alert', categoryCode: 'self_service', isMenuItem: false, displayOrder: 5 },
  { code: 'sos.read.own', name: 'View Own SOS Alerts', categoryCode: 'self_service', isMenuItem: false, displayOrder: 6 },
  { code: 'documents.upload', name: 'Upload Documents', categoryCode: 'self_service', isMenuItem: false, displayOrder: 7 },
  { code: 'documents.read.own', name: 'View Own Documents', categoryCode: 'self_service', isMenuItem: false, displayOrder: 8 },
  { code: 'feedback.submit', name: 'Submit Feedback', categoryCode: 'self_service', isMenuItem: false, displayOrder: 9 }
];

// Role-Permission mapping
const rolePermissionMapping: Record<string, string[]> = {
  'SUPER_ADMIN': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.delete', 'citizens.approve', 'citizens.map', 'citizens.map.all', 'citizens.map.pending', 'visits.read', 'visits.schedule', 'visits.complete', 'visits.delete', 'operations', 'operations.jurisdiction', 'sos.read', 'sos.respond', 'sos.resolve', 'operations.roster', 'personnel', 'officers.read', 'officers.write', 'officers.delete', 'officers.manage', 'personnel.hierarchy', 'analytics', 'reports.read', 'reports.generate', 'reports.export', 'analytics.dashboard', 'admin', 'admin.users', 'admin.roles', 'admin.permissions', 'admin.masters', 'notifications.manage', 'system', 'system.settings', 'audit.logs', 'system.backups'],

  'ADMIN': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.approve', 'citizens.map', 'citizens.map.all', 'citizens.map.pending', 'visits.read', 'visits.schedule', 'visits.complete', 'operations', 'operations.jurisdiction', 'sos.read', 'sos.respond', 'sos.resolve', 'operations.roster', 'personnel', 'officers.read', 'officers.write', 'officers.manage', 'personnel.hierarchy', 'analytics', 'reports.read', 'reports.generate', 'reports.export', 'analytics.dashboard', 'admin', 'admin.users', 'admin.roles', 'admin.masters', 'notifications.manage', 'system', 'system.settings', 'audit.logs'],

  'OFFICER': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],

  'SUPERVISOR': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.schedule', 'visits.complete', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'reports.read', 'reports.generate'],

  'CITIZEN': ['dashboard.citizen.view', 'profile.read.own', 'profile.update.own', 'visits.read.own', 'visits.request', 'sos.create', 'sos.read.own', 'documents.upload', 'documents.read.own', 'feedback.submit', 'notifications.manage'],

  'VIEWER': ['dashboard.admin.view', 'citizens.read', 'officers.read', 'visits.read', 'reports.read'],

  'CONTROL_ROOM': ['dashboard.admin.view', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'citizens.read', 'visits.read'],

  'DATA_ENTRY': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'documents.upload']
};

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function step1_BackupRolePermissions() {
  console.log('\n📦 STEP 1: Backing up existing role permissions...');

  const roles = await prisma.role.findMany();
  const backup = roles.map(role => ({
    code: role.code,
    name: role.name,
    permissions: role.permissions
  }));

  // Save backup to file
  const backupPath = path.join(__dirname, '../prisma/migrations/permission-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`✅ Backed up ${backup.length} roles to ${backupPath}`);
  return backup;
}

async function step2_CreateCategories() {
  console.log('\n📁 STEP 2: Creating permission categories...');

  const createdCategories: Record<string, any> = {};

  for (const category of categories) {
    const created = await prisma.permissionCategory.create({
      data: category
    });
    createdCategories[category.code] = created;
    console.log(`  ✓ ${category.name}`);
  }

  console.log(`✅ Created ${categories.length} categories`);
  return createdCategories;
}

async function step3_CreatePermissions(createdCategories: Record<string, any>) {
  console.log('\n🔑 STEP 3: Creating permissions...');

  const createdPermissions: Record<string, any> = {};

  // First pass: Create parent permissions
  const parentPermissions = permissions.filter(p => !p.parentCode);
  for (const permission of parentPermissions) {
    const created = await prisma.permission.create({
      data: {
        code: permission.code,
        name: permission.name,
        description: permission.description,
        categoryId: createdCategories[permission.categoryCode]?.id,
        menuPath: permission.menuPath,
        menuLabel: permission.menuLabel,
        menuIcon: permission.menuIcon,
        isMenuItem: permission.isMenuItem,
        displayOrder: permission.displayOrder,
        isActive: true
      }
    });
    createdPermissions[permission.code] = created;
    console.log(`  ✓ ${permission.name}`);
  }

  // Second pass: Create child permissions
  const childPermissions = permissions.filter(p => p.parentCode);
  for (const permission of childPermissions) {
    const created = await prisma.permission.create({
      data: {
        code: permission.code,
        name: permission.name,
        description: permission.description,
        categoryId: createdCategories[permission.categoryCode]?.id,
        parentId: createdPermissions[permission.parentCode!]?.id,
        menuPath: permission.menuPath,
        menuLabel: permission.menuLabel,
        menuIcon: permission.menuIcon,
        isMenuItem: permission.isMenuItem,
        displayOrder: permission.displayOrder,
        isActive: true
      }
    });
    createdPermissions[permission.code] = created;
    console.log(`  ✓ ${permission.name} (child of ${permission.parentCode})`);
  }

  console.log(`✅ Created ${permissions.length} permissions`);
  return createdPermissions;
}

async function step4_ApplyMigration() {
  console.log('\n🔄 STEP 4: Applying Prisma schema migration...');

  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Schema migration applied');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function step5_LinkRolePermissions(createdPermissions: Record<string, any>) {
  console.log('\n🔗 STEP 5: Linking roles to permissions...');

  for (const [roleCode, permissionCodes] of Object.entries(rolePermissionMapping)) {
    const role = await prisma.role.findUnique({
      where: { code: roleCode }
    });

    if (!role) {
      console.log(`  ⚠️  Role ${roleCode} not found, skipping...`);
      continue;
    }

    const permissionIds = permissionCodes
      .map(code => createdPermissions[code]?.id)
      .filter(Boolean);

    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: permissionIds.map(id => ({ id }))
        }
      }
    });

    console.log(`  ✓ ${roleCode}: ${permissionIds.length} permissions`);
  }

  console.log('✅ All roles linked to permissions');
}

async function step6_Verify() {
  console.log('\n📊 STEP 6: Verifying migration...');

  const categoryCount = await prisma.permissionCategory.count();
  const permissionCount = await prisma.permission.count();
  const rolesWithPermissions = await prisma.role.findMany({
    include: {
      _count: {
        select: { permissions: true }
      }
    }
  });

  console.log(`\n✅ Migration Summary:`);
  console.log(`  - Categories: ${categoryCount}`);
  console.log(`  - Permissions: ${permissionCount}`);
  console.log(`  - Roles:`);
  rolesWithPermissions.forEach(role => {
    console.log(`    • ${role.code}: ${role._count.permissions} permissions`);
  });
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Starting Dynamic Permission System Migration\n');
  console.log('='.repeat(60));

  try {
    const backup = await step1_BackupRolePermissions();
    const createdCategories = await step2_CreateCategories();
    const createdPermissions = await step3_CreatePermissions(createdCategories);
    await step4_ApplyMigration();
    await step5_LinkRolePermissions(createdPermissions);
    await step6_Verify();

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Test permission system');
    console.log('  3. Access Permission Master at /admin/masters/permissions');
    console.log('');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    console.log('\n📝 Rollback Instructions:');
    console.log('  1. Stop the backend server');
    console.log('  2. Run: npx prisma migrate reset');
    console.log('  3. Restore from backup if needed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
