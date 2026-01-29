
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PERMISSION DATA (Copied from migrate-permissions-complete.ts)
// ============================================

const categories = [
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

const permissions = [
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

async function sync() {
  console.log('🔄 Syncing permissions...');

  // 1. Sync Categories
  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const upserted = await prisma.permissionCategory.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat
    });
    categoryMap[cat.code] = upserted.id;
    process.stdout.write('.');
  }
  console.log('\n✅ Categories synced.');

  // 2. Sync Permissions (Parents first)
  const parents = permissions.filter(p => !p.parentCode);
  const permissionMap: Record<string, string> = {};

  for (const p of parents) {
    const { categoryCode, parentCode, ...data } = p;
    const upserted = await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        ...data,
        categoryId: categoryMap[categoryCode]
      },
      create: {
        ...data,
        categoryId: categoryMap[categoryCode]
      }
    });
    permissionMap[p.code] = upserted.id;
    process.stdout.write('.');
  }
  console.log('\n✅ Parent permissions synced.');

  // 3. Sync Children
  const children = permissions.filter(p => p.parentCode);
  for (const p of children) {
    const { categoryCode, parentCode, ...data } = p;
    const upserted = await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        ...data,
        categoryId: categoryMap[categoryCode],
        parentId: permissionMap[parentCode!]
      },
      create: {
        ...data,
        categoryId: categoryMap[categoryCode],
        parentId: permissionMap[parentCode!]
      }
    });
    process.stdout.write('.');
  }
  console.log('\n✅ Child permissions synced.');
}

sync()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
