import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Populating Permission Data\\n');

  try {
    // Check if data already exists
    const existingCategories = await prisma.permissionCategory.count();
    if (existingCategories > 0) {
      console.log(`⚠️  Found ${existingCategories} existing categories.`);
      console.log('Skipping data population to avoid duplicates.');
      console.log('If you want to re-populate, please clear the tables first.');
      return;
    }

    console.log('📁 Creating categories...');
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

    const createdCategories: Record<string, any> = {};
    for (const cat of categories) {
      const created = await prisma.permissionCategory.create({ data: cat });
      createdCategories[cat.code] = created;
      console.log(`  ✓ ${cat.name}`);
    }

    console.log(`\\n🔑 Creating permissions...`);
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

      // Visits
      { code: 'visits.read', name: 'View Visits', categoryCode: 'visits', menuPath: '/visits', menuLabel: 'Visits', menuIcon: 'ClipboardList', isMenuItem: true, displayOrder: 1 },
      { code: 'visits.schedule', name: 'Schedule Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 2 },
      { code: 'visits.complete', name: 'Complete Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 3 },

      // Operations
      { code: 'sos.read', name: 'View SOS Alerts', categoryCode: 'operations', menuPath: '/sos', menuLabel: 'SOS Alerts', menuIcon: 'Siren', isMenuItem: true, displayOrder: 1 },
      { code: 'sos.respond', name: 'Respond to SOS', categoryCode: 'operations', isMenuItem: false, displayOrder: 2 },
      { code: 'sos.resolve', name: 'Resolve SOS', categoryCode: 'operations', isMenuItem: false, displayOrder: 3 },

      // Personnel
      { code: 'officers.read', name: 'View Officers', categoryCode: 'personnel', menuPath: '/officers', menuLabel: 'Officers', menuIcon: 'UserCog', isMenuItem: true, displayOrder: 1 },
      { code: 'officers.write', name: 'Manage Officers', categoryCode: 'personnel', isMenuItem: false, displayOrder: 2 },
      { code: 'officers.manage', name: 'Full Officer Management', categoryCode: 'personnel', isMenuItem: false, displayOrder: 3 },

      // Analytics
      { code: 'reports.read', name: 'View Reports', categoryCode: 'analytics', menuPath: '/reports', menuLabel: 'Reports', menuIcon: 'FileBarChart', isMenuItem: true, displayOrder: 1 },
      { code: 'reports.generate', name: 'Generate Reports', categoryCode: 'analytics', isMenuItem: false, displayOrder: 2 },
      { code: 'reports.export', name: 'Export Reports', categoryCode: 'analytics', isMenuItem: false, displayOrder: 3 },

      // Admin
      { code: 'admin.users', name: 'Manage Users', categoryCode: 'admin', menuPath: '/users', menuLabel: 'Users', menuIcon: 'Users', isMenuItem: true, displayOrder: 1 },
      { code: 'admin.roles', name: 'Manage Roles', categoryCode: 'admin', menuPath: '/admin/masters/roles', menuLabel: 'Roles', menuIcon: 'Shield', isMenuItem: true, displayOrder: 2 },
      { code: 'admin.permissions', name: 'Manage Permissions', categoryCode: 'admin', menuPath: '/admin/masters/permissions', menuLabel: 'Permissions', menuIcon: 'Key', isMenuItem: true, displayOrder: 3 },

      // System
      { code: 'system.settings', name: 'System Configuration', categoryCode: 'system', menuPath: '/settings', menuLabel: 'Settings', menuIcon: 'Settings', isMenuItem: true, displayOrder: 1 },
      { code: 'audit.logs', name: 'View Audit Logs', categoryCode: 'system', menuPath: '/audit', menuLabel: 'Audit Logs', menuIcon: 'History', isMenuItem: true, displayOrder: 2 },

      // Self Service
      { code: 'profile.read.own', name: 'View Own Profile', categoryCode: 'self_service', isMenuItem: false, displayOrder: 1 },
      { code: 'profile.update.own', name: 'Update Own Profile', categoryCode: 'self_service', isMenuItem: false, displayOrder: 2 },
      { code: 'visits.read.own', name: 'View Own Visits', categoryCode: 'self_service', isMenuItem: false, displayOrder: 3 },
      { code: 'sos.create', name: 'Create SOS Alert', categoryCode: 'self_service', isMenuItem: false, displayOrder: 4 },
    ];

    const createdPermissions: Record<string, any> = {};
    for (const perm of permissions) {
      const created = await prisma.permission.create({
        data: {
          code: perm.code,
          name: perm.name,
          categoryId: createdCategories[perm.categoryCode]?.id,
          menuPath: perm.menuPath,
          menuLabel: perm.menuLabel,
          menuIcon: perm.menuIcon,
          isMenuItem: perm.isMenuItem,
          displayOrder: perm.displayOrder,
          isActive: true
        }
      });
      createdPermissions[perm.code] = created;
      console.log(`  ✓ ${perm.name}`);
    }

    console.log(`\\n🔗 Linking roles to permissions...`);
    const roleMapping: Record<string, string[]> = {
      'SUPER_ADMIN': Object.keys(createdPermissions),
      'ADMIN': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.approve', 'visits.read', 'visits.schedule', 'visits.complete', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'officers.write', 'reports.read', 'reports.generate', 'admin.users', 'admin.roles', 'system.settings', 'audit.logs'],
      'OFFICER': ['dashboard.officer.view', 'citizens.read', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
      'CITIZEN': ['dashboard.citizen.view', 'profile.read.own', 'profile.update.own', 'visits.read.own', 'sos.create'],
      'VIEWER': ['dashboard.admin.view', 'citizens.read', 'officers.read', 'visits.read', 'reports.read'],
      'CONTROL_ROOM': ['dashboard.admin.view', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'citizens.read', 'visits.read'],
      'DATA_ENTRY': ['dashboard.admin.view', 'citizens.read', 'citizens.write']
    };

    for (const [roleCode, permCodes] of Object.entries(roleMapping)) {
      const role = await prisma.role.findUnique({ where: { code: roleCode } });
      if (!role) {
        console.log(`  ⚠️  Role ${roleCode} not found`);
        continue;
      }

      const permIds = permCodes.map(code => createdPermissions[code]?.id).filter(Boolean);
      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: permIds.map(id => ({ id }))
          }
        }
      });
      console.log(`  ✓ ${roleCode}: ${permIds.length} permissions`);
    }

    console.log(`\\n✅ Migration completed successfully!`);
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Permissions: ${permissions.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
