import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

const rolePermissionMapping: Record<string, string[]> = {
  'SUPER_ADMIN': permissions.map(p => p.code),
  'ADMIN': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.approve', 'citizens.map', 'citizens.map.all', 'citizens.map.pending', 'visits.read', 'visits.schedule', 'visits.complete', 'operations', 'operations.jurisdiction', 'sos.read', 'sos.respond', 'sos.resolve', 'operations.roster', 'personnel', 'officers.read', 'officers.write', 'officers.manage', 'personnel.hierarchy', 'analytics', 'reports.read', 'reports.generate', 'reports.export', 'analytics.dashboard', 'admin', 'admin.users', 'admin.roles', 'admin.masters', 'notifications.manage', 'system', 'system.settings', 'audit.logs'],
  'OFFICER': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
  'BEAT_OFFICER': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
  'CONSTABLE': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
  'HEAD_CONSTABLE': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
  'ASI': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
  'SI': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
  'INSPECTOR': ['dashboard.admin.view', 'dashboard.officer.view', 'citizens.read', 'citizens.write', 'citizens.approve', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.schedule', 'visits.complete', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'reports.read', 'reports.generate'],
  'SHO': ['dashboard.admin.view', 'dashboard.officer.view', 'citizens.read', 'citizens.write', 'citizens.approve', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.schedule', 'visits.complete', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'reports.read', 'reports.generate'],
  'SUPERVISOR': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.schedule', 'visits.complete', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'reports.read', 'reports.generate'],
  'CITIZEN': ['dashboard.citizen.view', 'profile.read.own', 'profile.update.own', 'visits.read.own', 'visits.request', 'sos.create', 'sos.read.own', 'documents.upload', 'documents.read.own', 'feedback.submit', 'notifications.manage'],
  'VIEWER': ['dashboard.admin.view', 'citizens.read', 'officers.read', 'visits.read', 'reports.read'],
  'CONTROL_ROOM': ['dashboard.admin.view', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'citizens.read', 'visits.read'],
  'DATA_ENTRY': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'documents.upload']
};

async function main() {
  console.log('🔄 1. Syncing Categories...');
  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const upserted = await prisma.permissionCategory.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat
    });
    categoryMap[cat.code] = upserted.id;
  }

  console.log('🔄 2. Syncing Permissions...');
  const permissionMap: Record<string, string> = {};
  const parents = permissions.filter(p => !p.parentCode);
  for (const p of parents) {
    const { categoryCode, parentCode, ...data } = p;
    const upserted = await prisma.permission.upsert({
      where: { code: p.code },
      update: { ...data, categoryId: categoryMap[categoryCode] },
      create: { ...data, categoryId: categoryMap[categoryCode] }
    });
    permissionMap[p.code] = upserted.id;
  }

  const children = permissions.filter(p => p.parentCode);
  for (const p of children) {
    const { categoryCode, parentCode, ...data } = p;
    const upserted = await prisma.permission.upsert({
      where: { code: p.code },
      update: { ...data, categoryId: categoryMap[categoryCode], parentId: permissionMap[parentCode!] },
      create: { ...data, categoryId: categoryMap[categoryCode], parentId: permissionMap[parentCode!] }
    });
    permissionMap[p.code] = upserted.id;
  }

  console.log('🔄 3. Linking Roles to Permissions...');
  for (const [roleCode, permCodes] of Object.entries(rolePermissionMapping)) {
    let role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          code: roleCode,
          name: roleCode.replace('_', ' '),
          isActive: true
        }
      });
      console.log(`  + Created role: ${roleCode}`);
    }

    const permIds = permCodes.map(c => permissionMap[c]).filter(Boolean);
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          set: permIds.map(id => ({ id }))
        }
      }
    });
    console.log(`  ✓ Linked ${roleCode} with ${permIds.length} permissions`);
  }

  console.log('🔄 4. Checking Officer 10000004...');
  const officer = await prisma.beatOfficer.findFirst({
    where: { badgeNumber: '10000004' },
    include: { user: true }
  });
  console.log('  Officer:', officer?.name, 'Rank:', officer?.rank, 'User ID:', officer?.user?.id, 'User Role:', officer?.user?.role);

  if (officer) {
    if (!officer.user) {
      const user = await prisma.user.create({
        data: {
          email: officer.email || `officer.${officer.badgeNumber}@delhipolice.gov.in`,
          phone: officer.mobileNumber,
          passwordHash: '',
          role: 'OFFICER',
          isActive: true,
          officerProfile: {
            connect: { id: officer.id }
          }
        }
      });
      console.log('  + Created user for officer:', user.email);
    } else if (officer.user.role !== 'OFFICER') {
      await prisma.user.update({
        where: { id: officer.user.id },
        data: { role: 'OFFICER' }
      });
      console.log('  ✓ Updated user role to OFFICER');
    }
  }

  console.log('🎉 Done syncing all permissions!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
