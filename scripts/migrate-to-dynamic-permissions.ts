import { PrismaClient } from '@prisma/client';
import { Permission as OldPermission, RolePermissions, Role } from '../src/types/auth';

const prisma = new PrismaClient();

/**
 * Data Migration Script for Dynamic Permission System
 *
 * This script:
 * 1. Backs up existing role permissions
 * 2. Creates permission categories
 * 3. Creates permissions matching old Permission enum
 * 4. Migrates role-permission relationships
 *
 * Run BEFORE applying the schema migration!
 */

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

interface CategoryData {
  code: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
}

// Step 1: Define Permission Categories
const categories: CategoryData[] = [
  {
    code: 'dashboard',
    name: 'Dashboard',
    description: 'Dashboard access permissions',
    icon: 'Home',
    displayOrder: 1
  },
  {
    code: 'citizens',
    name: 'Citizens',
    description: 'Citizen management permissions',
    icon: 'Users',
    displayOrder: 2
  },
  {
    code: 'visits',
    name: 'Visits',
    description: 'Visit management permissions',
    icon: 'ClipboardList',
    displayOrder: 3
  },
  {
    code: 'operations',
    name: 'Operations',
    description: 'Operational permissions',
    icon: 'Shield',
    displayOrder: 4
  },
  {
    code: 'personnel',
    name: 'Personnel',
    description: 'Personnel management permissions',
    icon: 'Users',
    displayOrder: 5
  },
  {
    code: 'analytics',
    name: 'Analytics',
    description: 'Analytics and reporting permissions',
    icon: 'BarChart3',
    displayOrder: 6
  },
  {
    code: 'admin',
    name: 'Admin',
    description: 'Administrative permissions',
    icon: 'Shield',
    displayOrder: 7
  },
  {
    code: 'system',
    name: 'System',
    description: 'System configuration permissions',
    icon: 'Settings',
    displayOrder: 8
  },
  {
    code: 'self_service',
    name: 'Self Service',
    description: 'Citizen self-service permissions',
    icon: 'User',
    displayOrder: 9
  }
];

// Step 2: Map old permissions to new permission structure
const permissions: PermissionData[] = [
  // Dashboard Permissions
  {
    code: 'dashboard.admin.view',
    name: 'View Admin Dashboard',
    description: 'Access to admin dashboard',
    categoryCode: 'dashboard',
    menuPath: '/admin/dashboard',
    menuLabel: 'Dashboard',
    menuIcon: 'Home',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: 'dashboard.officer.view',
    name: 'View Officer Dashboard',
    description: 'Access to officer app dashboard',
    categoryCode: 'dashboard',
    menuPath: '/officer-app/dashboard',
    menuLabel: 'Officer Dashboard',
    menuIcon: 'Shield',
    isMenuItem: true,
    displayOrder: 2
  },
  {
    code: 'dashboard.citizen.view',
    name: 'View Citizen Dashboard',
    description: 'Access to citizen portal dashboard',
    categoryCode: 'dashboard',
    menuPath: '/citizen-portal/dashboard',
    menuLabel: 'Citizen Dashboard',
    menuIcon: 'User',
    isMenuItem: true,
    displayOrder: 3
  },

  // Citizens Permissions
  {
    code: OldPermission.CITIZENS_READ,
    name: 'View Citizens',
    description: 'View citizen records',
    categoryCode: 'citizens',
    menuPath: '/citizens',
    menuLabel: 'Citizens',
    menuIcon: 'Users',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: OldPermission.CITIZENS_WRITE,
    name: 'Manage Citizens',
    description: 'Create and edit citizen records',
    categoryCode: 'citizens',
    isMenuItem: false,
    displayOrder: 2
  },
  {
    code: OldPermission.CITIZENS_DELETE,
    name: 'Delete Citizens',
    description: 'Delete citizen records',
    categoryCode: 'citizens',
    isMenuItem: false,
    displayOrder: 3
  },
  {
    code: 'citizens.approve',
    name: 'Approve Registrations',
    description: 'Approve citizen registrations',
    categoryCode: 'citizens',
    menuPath: '/approvals',
    menuLabel: 'Registration Approvals',
    menuIcon: 'FileCheck',
    isMenuItem: true,
    displayOrder: 4
  },
  {
    code: 'citizens.map',
    name: 'Citizen Map',
    description: 'View citizen maps',
    categoryCode: 'citizens',
    menuLabel: 'Citizen Map',
    menuIcon: 'Map',
    isMenuItem: true,
    displayOrder: 5
  },
  {
    code: 'citizens.map.all',
    name: 'All Citizens Map',
    description: 'View all citizens on map',
    categoryCode: 'citizens',
    menuPath: '/citizens/map',
    menuLabel: 'All Citizens',
    menuIcon: 'MapPin',
    isMenuItem: true,
    displayOrder: 1,
    parentCode: 'citizens.map'
  },
  {
    code: 'citizens.map.pending',
    name: 'Pending Verification Map',
    description: 'View pending verifications on map',
    categoryCode: 'citizens',
    menuPath: '/citizens/map/pending',
    menuLabel: 'Pending Verification',
    menuIcon: 'AlertTriangle',
    isMenuItem: true,
    displayOrder: 2,
    parentCode: 'citizens.map'
  },

  // Visits Permissions
  {
    code: OldPermission.VISITS_READ,
    name: 'View Visits',
    description: 'View visit records',
    categoryCode: 'visits',
    menuPath: '/visits',
    menuLabel: 'Visits',
    menuIcon: 'ClipboardList',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: OldPermission.VISITS_SCHEDULE,
    name: 'Schedule Visits',
    description: 'Schedule new visits',
    categoryCode: 'visits',
    isMenuItem: false,
    displayOrder: 2
  },
  {
    code: OldPermission.VISITS_COMPLETE,
    name: 'Complete Visits',
    description: 'Mark visits as complete',
    categoryCode: 'visits',
    isMenuItem: false,
    displayOrder: 3
  },
  {
    code: OldPermission.VISITS_DELETE,
    name: 'Delete Visits',
    description: 'Delete visit records',
    categoryCode: 'visits',
    isMenuItem: false,
    displayOrder: 4
  },

  // Operations Permissions
  {
    code: 'operations',
    name: 'Operations',
    description: 'Operational functions',
    categoryCode: 'operations',
    menuLabel: 'Operations',
    menuIcon: 'Shield',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: 'operations.jurisdiction',
    name: 'Jurisdiction Map',
    description: 'View jurisdiction maps',
    categoryCode: 'operations',
    menuPath: '/maps',
    menuLabel: 'Jurisdiction Map',
    menuIcon: 'MapPin',
    isMenuItem: true,
    displayOrder: 1,
    parentCode: 'operations'
  },
  {
    code: OldPermission.SOS_READ,
    name: 'View SOS Alerts',
    description: 'View SOS alerts',
    categoryCode: 'operations',
    menuPath: '/sos',
    menuLabel: 'SOS Alerts',
    menuIcon: 'Siren',
    isMenuItem: true,
    displayOrder: 2,
    parentCode: 'operations'
  },
  {
    code: OldPermission.SOS_RESPOND,
    name: 'Respond to SOS',
    description: 'Respond to SOS alerts',
    categoryCode: 'operations',
    isMenuItem: false,
    displayOrder: 3
  },
  {
    code: OldPermission.SOS_RESOLVE,
    name: 'Resolve SOS',
    description: 'Resolve SOS alerts',
    categoryCode: 'operations',
    isMenuItem: false,
    displayOrder: 4
  },
  {
    code: 'operations.roster',
    name: 'Duty Roster',
    description: 'View duty roster',
    categoryCode: 'operations',
    menuPath: '/roster',
    menuLabel: 'Duty Roster',
    menuIcon: 'CalendarDays',
    isMenuItem: true,
    displayOrder: 5,
    parentCode: 'operations'
  },

  // Personnel Permissions
  {
    code: 'personnel',
    name: 'Personnel',
    description: 'Personnel management',
    categoryCode: 'personnel',
    menuLabel: 'Personnel',
    menuIcon: 'Users',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: OldPermission.OFFICERS_READ,
    name: 'View Officers',
    description: 'View officer records',
    categoryCode: 'personnel',
    menuPath: '/officers',
    menuLabel: 'Officers',
    menuIcon: 'UserCog',
    isMenuItem: true,
    displayOrder: 1,
    parentCode: 'personnel'
  },
  {
    code: OldPermission.OFFICERS_WRITE,
    name: 'Manage Officers',
    description: 'Create and edit officers',
    categoryCode: 'personnel',
    isMenuItem: false,
    displayOrder: 2
  },
  {
    code: OldPermission.OFFICERS_DELETE,
    name: 'Delete Officers',
    description: 'Delete officer records',
    categoryCode: 'personnel',
    isMenuItem: false,
    displayOrder: 3
  },
  {
    code: OldPermission.OFFICERS_MANAGE,
    name: 'Full Officer Management',
    description: 'Complete officer management access',
    categoryCode: 'personnel',
    isMenuItem: false,
    displayOrder: 4
  },
  {
    code: 'personnel.hierarchy',
    name: 'View Hierarchy',
    description: 'View organizational hierarchy',
    categoryCode: 'personnel',
    menuPath: '/hierarchy',
    menuLabel: 'Hierarchy',
    menuIcon: 'GitGraph',
    isMenuItem: true,
    displayOrder: 5,
    parentCode: 'personnel'
  },

  // Analytics Permissions
  {
    code: 'analytics',
    name: 'Analytics',
    description: 'Analytics and reporting',
    categoryCode: 'analytics',
    menuLabel: 'Analytics',
    menuIcon: 'BarChart3',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: OldPermission.REPORTS_READ,
    name: 'View Reports',
    description: 'View reports',
    categoryCode: 'analytics',
    menuPath: '/reports',
    menuLabel: 'Reports',
    menuIcon: 'FileBarChart',
    isMenuItem: true,
    displayOrder: 1,
    parentCode: 'analytics'
  },
  {
    code: OldPermission.REPORTS_GENERATE,
    name: 'Generate Reports',
    description: 'Generate new reports',
    categoryCode: 'analytics',
    isMenuItem: false,
    displayOrder: 2
  },
  {
    code: OldPermission.REPORTS_EXPORT,
    name: 'Export Reports',
    description: 'Export reports',
    categoryCode: 'analytics',
    isMenuItem: false,
    displayOrder: 3
  },
  {
    code: 'analytics.dashboard',
    name: 'Analytics Dashboard',
    description: 'View analytics dashboard',
    categoryCode: 'analytics',
    menuPath: '/analytics',
    menuLabel: 'Analytics',
    menuIcon: 'BarChart3',
    isMenuItem: true,
    displayOrder: 4,
    parentCode: 'analytics'
  },

  // Admin Permissions
  {
    code: 'admin',
    name: 'Admin',
    description: 'Administrative functions',
    categoryCode: 'admin',
    menuLabel: 'Admin',
    menuIcon: 'Shield',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: 'admin.users',
    name: 'Manage Users',
    description: 'User management',
    categoryCode: 'admin',
    menuPath: '/users',
    menuLabel: 'Users',
    menuIcon: 'Users',
    isMenuItem: true,
    displayOrder: 1,
    parentCode: 'admin'
  },
  {
    code: 'admin.roles',
    name: 'Manage Roles',
    description: 'Role management',
    categoryCode: 'admin',
    menuPath: '/admin/masters/roles',
    menuLabel: 'Roles',
    menuIcon: 'Shield',
    isMenuItem: true,
    displayOrder: 2,
    parentCode: 'admin'
  },
  {
    code: 'admin.permissions',
    name: 'Manage Permissions',
    description: 'Permission management',
    categoryCode: 'admin',
    menuPath: '/admin/masters/permissions',
    menuLabel: 'Permissions',
    menuIcon: 'Key',
    isMenuItem: true,
    displayOrder: 3,
    parentCode: 'admin'
  },
  {
    code: 'admin.masters',
    name: 'Manage Masters',
    description: 'Master data management',
    categoryCode: 'admin',
    menuPath: '/admin/masters',
    menuLabel: 'Masters',
    menuIcon: 'Database',
    isMenuItem: true,
    displayOrder: 4,
    parentCode: 'admin'
  },
  {
    code: OldPermission.NOTIFICATIONS_MANAGE,
    name: 'Manage Notifications',
    description: 'Notification management',
    categoryCode: 'admin',
    menuPath: '/notifications',
    menuLabel: 'Notifications',
    menuIcon: 'Bell',
    isMenuItem: true,
    displayOrder: 5,
    parentCode: 'admin'
  },

  // System Permissions
  {
    code: 'system',
    name: 'System',
    description: 'System configuration',
    categoryCode: 'system',
    menuLabel: 'System',
    menuIcon: 'Settings',
    isMenuItem: true,
    displayOrder: 1
  },
  {
    code: OldPermission.SYSTEM_SETTINGS,
    name: 'System Configuration',
    description: 'System settings',
    categoryCode: 'system',
    menuPath: '/settings',
    menuLabel: 'Config',
    menuIcon: 'Settings',
    isMenuItem: true,
    displayOrder: 1,
    parentCode: 'system'
  },
  {
    code: OldPermission.AUDIT_LOGS,
    name: 'View Audit Logs',
    description: 'View audit logs',
    categoryCode: 'system',
    menuPath: '/audit',
    menuLabel: 'Audit',
    menuIcon: 'History',
    isMenuItem: true,
    displayOrder: 2,
    parentCode: 'system'
  },
  {
    code: 'system.backups',
    name: 'Manage Backups',
    description: 'Database backups',
    categoryCode: 'system',
    menuPath: '/settings?tab=database',
    menuLabel: 'Backups',
    menuIcon: 'Database',
    isMenuItem: true,
    displayOrder: 3,
    parentCode: 'system'
  },

  // Self-Service Permissions (Citizen Portal)
  {
    code: OldPermission.PROFILE_READ_OWN,
    name: 'View Own Profile',
    description: 'View own profile',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 1
  },
  {
    code: OldPermission.PROFILE_UPDATE_OWN,
    name: 'Update Own Profile',
    description: 'Update own profile',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 2
  },
  {
    code: OldPermission.VISITS_READ_OWN,
    name: 'View Own Visits',
    description: 'View own visits',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 3
  },
  {
    code: OldPermission.VISITS_REQUEST,
    name: 'Request Visits',
    description: 'Request new visits',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 4
  },
  {
    code: OldPermission.SOS_CREATE,
    name: 'Create SOS Alert',
    description: 'Create SOS alerts',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 5
  },
  {
    code: OldPermission.SOS_READ_OWN,
    name: 'View Own SOS Alerts',
    description: 'View own SOS alerts',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 6
  },
  {
    code: OldPermission.DOCUMENTS_UPLOAD,
    name: 'Upload Documents',
    description: 'Upload documents',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 7
  },
  {
    code: OldPermission.DOCUMENTS_READ_OWN,
    name: 'View Own Documents',
    description: 'View own documents',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 8
  },
  {
    code: OldPermission.FEEDBACK_SUBMIT,
    name: 'Submit Feedback',
    description: 'Submit feedback',
    categoryCode: 'self_service',
    isMenuItem: false,
    displayOrder: 9
  }
];

// Step 3: Map old permissions to new permission codes
const oldToNewPermissionMap: Record<string, string> = {
  [OldPermission.CITIZENS_READ]: OldPermission.CITIZENS_READ,
  [OldPermission.CITIZENS_WRITE]: OldPermission.CITIZENS_WRITE,
  [OldPermission.CITIZENS_DELETE]: OldPermission.CITIZENS_DELETE,
  [OldPermission.OFFICERS_READ]: OldPermission.OFFICERS_READ,
  [OldPermission.OFFICERS_WRITE]: OldPermission.OFFICERS_WRITE,
  [OldPermission.OFFICERS_DELETE]: OldPermission.OFFICERS_DELETE,
  [OldPermission.OFFICERS_MANAGE]: OldPermission.OFFICERS_MANAGE,
  [OldPermission.VISITS_READ]: OldPermission.VISITS_READ,
  [OldPermission.VISITS_SCHEDULE]: OldPermission.VISITS_SCHEDULE,
  [OldPermission.VISITS_COMPLETE]: OldPermission.VISITS_COMPLETE,
  [OldPermission.VISITS_DELETE]: OldPermission.VISITS_DELETE,
  [OldPermission.SOS_READ]: OldPermission.SOS_READ,
  [OldPermission.SOS_RESPOND]: OldPermission.SOS_RESPOND,
  [OldPermission.SOS_RESOLVE]: OldPermission.SOS_RESOLVE,
  [OldPermission.REPORTS_READ]: OldPermission.REPORTS_READ,
  [OldPermission.REPORTS_GENERATE]: OldPermission.REPORTS_GENERATE,
  [OldPermission.REPORTS_EXPORT]: OldPermission.REPORTS_EXPORT,
  [OldPermission.SYSTEM_SETTINGS]: OldPermission.SYSTEM_SETTINGS,
  [OldPermission.AUDIT_LOGS]: OldPermission.AUDIT_LOGS,
  [OldPermission.PROFILE_READ_OWN]: OldPermission.PROFILE_READ_OWN,
  [OldPermission.PROFILE_UPDATE_OWN]: OldPermission.PROFILE_UPDATE_OWN,
  [OldPermission.VISITS_READ_OWN]: OldPermission.VISITS_READ_OWN,
  [OldPermission.VISITS_REQUEST]: OldPermission.VISITS_REQUEST,
  [OldPermission.SOS_CREATE]: OldPermission.SOS_CREATE,
  [OldPermission.SOS_READ_OWN]: OldPermission.SOS_READ_OWN,
  [OldPermission.DOCUMENTS_UPLOAD]: OldPermission.DOCUMENTS_UPLOAD,
  [OldPermission.DOCUMENTS_READ_OWN]: OldPermission.DOCUMENTS_READ_OWN,
  [OldPermission.FEEDBACK_SUBMIT]: OldPermission.FEEDBACK_SUBMIT,
  [OldPermission.NOTIFICATIONS_MANAGE]: OldPermission.NOTIFICATIONS_MANAGE
};

async function main() {
  console.log('🚀 Starting data migration for dynamic permission system...\n');

  try {
    // Step 1: Backup existing role permissions
    console.log('📦 Step 1: Backing up existing role permissions...');
    const existingRoles = await prisma.role.findMany();
    const backup = existingRoles.map(role => ({
      code: role.code,
      name: role.name,
      permissions: role.permissions
    }));
    console.log(`✅ Backed up ${backup.length} roles`);
    console.log(JSON.stringify(backup, null, 2));
    console.log('');

    // Step 2: Create permission categories
    console.log('📁 Step 2: Creating permission categories...');
    const createdCategories: Record<string, any> = {};
    for (const category of categories) {
      const created = await prisma.permissionCategory.create({
        data: category
      });
      createdCategories[category.code] = created;
      console.log(`  ✓ Created category: ${category.name}`);
    }
    console.log(`✅ Created ${categories.length} categories\n`);

    // Step 3: Create permissions (parents first, then children)
    console.log('🔑 Step 3: Creating permissions...');
    const createdPermissions: Record<string, any> = {};

    // First pass: Create all parent permissions
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
      console.log(`  ✓ Created permission: ${permission.name}`);
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
      console.log(`  ✓ Created child permission: ${permission.name} (parent: ${permission.parentCode})`);
    }
    console.log(`✅ Created ${permissions.length} permissions\n`);

    // Step 4: Migrate role-permission relationships
    console.log('🔗 Step 4: Migrating role-permission relationships...');
    for (const roleCode of Object.keys(RolePermissions)) {
      const role = await prisma.role.findUnique({
        where: { code: roleCode }
      });

      if (!role) {
        console.log(`  ⚠️  Role ${roleCode} not found in database, skipping...`);
        continue;
      }

      const oldPermissions = RolePermissions[roleCode as Role];
      const newPermissionIds: string[] = [];

      // Map old permissions to new permission IDs
      for (const oldPerm of oldPermissions) {
        const newCode = oldToNewPermissionMap[oldPerm];
        if (newCode && createdPermissions[newCode]) {
          newPermissionIds.push(createdPermissions[newCode].id);
        } else {
          console.log(`  ⚠️  Permission ${oldPerm} not found in new system`);
        }
      }

      // Add dashboard permission based on role
      if (roleCode === 'CITIZEN') {
        if (createdPermissions['dashboard.citizen.view']) {
          newPermissionIds.push(createdPermissions['dashboard.citizen.view'].id);
        }
      } else if (roleCode === 'OFFICER') {
        if (createdPermissions['dashboard.officer.view']) {
          newPermissionIds.push(createdPermissions['dashboard.officer.view'].id);
        }
      } else {
        if (createdPermissions['dashboard.admin.view']) {
          newPermissionIds.push(createdPermissions['dashboard.admin.view'].id);
        }
      }

      console.log(`  ✓ Migrating ${roleCode}: ${oldPermissions.length} old permissions → ${newPermissionIds.length} new permissions`);
    }

    console.log(`✅ Migration preparation complete!\n`);
    console.log('📝 Summary:');
    console.log(`  - Categories created: ${categories.length}`);
    console.log(`  - Permissions created: ${permissions.length}`);
    console.log(`  - Roles to migrate: ${Object.keys(RolePermissions).length}`);
    console.log('');
    console.log('⚠️  IMPORTANT: The actual role-permission links will be created AFTER the schema migration.');
    console.log('   This script only creates the Permission and PermissionCategory records.');
    console.log('');
    console.log('✅ Next steps:');
    console.log('   1. Review the created permissions');
    console.log('   2. Run: npx prisma migrate dev');
    console.log('   3. Run: npm run migrate:role-permissions (to link roles to permissions)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
