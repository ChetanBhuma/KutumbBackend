import { PrismaClient } from '@prisma/client';
import { Permission as OldPermission, RolePermissions, Role } from '../src/types/auth';

const prisma = new PrismaClient();

/**
 * Role-Permission Linking Script
 *
 * Run AFTER the schema migration to link roles to permissions
 */

// Map old permissions to new permission codes
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
  console.log('🔗 Linking roles to permissions...\n');

  try {
    // Get all permissions
    const allPermissions = await prisma.permission.findMany();
    const permissionMap: Record<string, string> = {};
    allPermissions.forEach(p => {
      permissionMap[p.code] = p.id;
    });

    console.log(`📋 Found ${allPermissions.length} permissions in database\n`);

    // Link each role to its permissions
    for (const roleCode of Object.keys(RolePermissions)) {
      const role = await prisma.role.findUnique({
        where: { code: roleCode }
      });

      if (!role) {
        console.log(`⚠️  Role ${roleCode} not found in database, skipping...`);
        continue;
      }

      const oldPermissions = RolePermissions[roleCode as Role];
      const permissionIds: string[] = [];

      // Map old permissions to new permission IDs
      for (const oldPerm of oldPermissions) {
        const newCode = oldToNewPermissionMap[oldPerm];
        if (newCode && permissionMap[newCode]) {
          permissionIds.push(permissionMap[newCode]);
        } else {
          console.log(`  ⚠️  Permission ${oldPerm} not found in database`);
        }
      }

      // Add dashboard permission based on role
      if (roleCode === 'CITIZEN') {
        if (permissionMap['dashboard.citizen.view']) {
          permissionIds.push(permissionMap['dashboard.citizen.view']);
        }
      } else if (roleCode === 'OFFICER') {
        if (permissionMap['dashboard.officer.view']) {
          permissionIds.push(permissionMap['dashboard.officer.view']);
        }
        // Add citizens.map permissions for officers
        if (permissionMap['citizens.map']) {
          permissionIds.push(permissionMap['citizens.map']);
        }
        if (permissionMap['citizens.map.all']) {
          permissionIds.push(permissionMap['citizens.map.all']);
        }
      } else {
        if (permissionMap['dashboard.admin.view']) {
          permissionIds.push(permissionMap['dashboard.admin.view']);
        }
        // Add all menu permissions for admin roles
        if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN') {
          if (permissionMap['citizens.map']) {
            permissionIds.push(permissionMap['citizens.map']);
          }
          if (permissionMap['citizens.map.all']) {
            permissionIds.push(permissionMap['citizens.map.all']);
          }
          if (permissionMap['citizens.map.pending']) {
            permissionIds.push(permissionMap['citizens.map.pending']);
          }
          if (permissionMap['citizens.approve']) {
            permissionIds.push(permissionMap['citizens.approve']);
          }
          if (permissionMap['operations']) {
            permissionIds.push(permissionMap['operations']);
          }
          if (permissionMap['operations.jurisdiction']) {
            permissionIds.push(permissionMap['operations.jurisdiction']);
          }
          if (permissionMap['operations.roster']) {
            permissionIds.push(permissionMap['operations.roster']);
          }
          if (permissionMap['personnel']) {
            permissionIds.push(permissionMap['personnel']);
          }
          if (permissionMap['personnel.hierarchy']) {
            permissionIds.push(permissionMap['personnel.hierarchy']);
          }
          if (permissionMap['analytics']) {
            permissionIds.push(permissionMap['analytics']);
          }
          if (permissionMap['analytics.dashboard']) {
            permissionIds.push(permissionMap['analytics.dashboard']);
          }
          if (permissionMap['admin']) {
            permissionIds.push(permissionMap['admin']);
          }
          if (permissionMap['admin.users']) {
            permissionIds.push(permissionMap['admin.users']);
          }
          if (permissionMap['admin.roles']) {
            permissionIds.push(permissionMap['admin.roles']);
          }
          if (permissionMap['admin.permissions']) {
            permissionIds.push(permissionMap['admin.permissions']);
          }
          if (permissionMap['admin.masters']) {
            permissionIds.push(permissionMap['admin.masters']);
          }
          if (permissionMap['system']) {
            permissionIds.push(permissionMap['system']);
          }
          if (permissionMap['system.backups']) {
            permissionIds.push(permissionMap['system.backups']);
          }
        }
      }

      // Remove duplicates
      const uniquePermissionIds = [...new Set(permissionIds)];

      // Update role with permissions
      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: uniquePermissionIds.map(id => ({ id }))
          }
        }
      });

      console.log(`✅ ${roleCode}: Linked ${uniquePermissionIds.length} permissions`);
    }

    console.log('\n✅ All roles linked to permissions successfully!');

    // Verify
    console.log('\n📊 Verification:');
    const rolesWithPermissions = await prisma.role.findMany({
      include: {
        _count: {
          select: { permissions: true }
        }
      }
    });

    rolesWithPermissions.forEach(role => {
      console.log(`  ${role.code}: ${role._count.permissions} permissions`);
    });

  } catch (error) {
    console.error('❌ Linking failed:', error);
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
