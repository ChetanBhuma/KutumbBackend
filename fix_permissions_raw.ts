
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPermissions() {
    console.log('Fixing Admin Permissions via Raw SQL...');

    try {
        // 1. Get Role IDs
        const roles = await prisma.$queryRaw<any[]>`SELECT id, code FROM "Role" WHERE code IN ('SUPER_ADMIN', 'ADMIN')`;
        const saRole = roles.find(r => r.code === 'SUPER_ADMIN');
        const adminRole = roles.find(r => r.code === 'ADMIN');

        if (!saRole || !adminRole) {
            console.error('Roles not found! Run fix_admin_roles_raw.ts first.');
            return;
        }

        console.log('Found Roles:', roles);

        // 2. Get Permission IDs
        // For Super Admin: ALL permissions
        const allPerms = await prisma.$queryRaw<any[]>`SELECT id, code FROM "Permission"`;

        // For Admin: subset
        const adminPermCodes = [
            'citizens.read', 'citizens.write', 'citizens.delete',
            'officers.read', 'officers.write', 'officers.manage',
            'visits.read', 'visits.schedule', 'visits.complete',
            'sos.read', 'sos.respond', 'sos.resolve',
            'reports.read', 'reports.generate', 'reports.export',
            'system.settings'
        ];
        const adminPerms = allPerms.filter(p => adminPermCodes.includes(p.code));

        console.log(`Found ${allPerms.length} total permissions.`);
        console.log(`Found ${adminPerms.length} admin permissions.`);

        // 3. Insert into _RolePermissions
        // Assumption: A = Permission.id, B = Role.id (Alphabetical Permission < Role)

        // Insert for SUPER_ADMIN
        for (const perm of allPerms) {
            try {
                // Use ON CONFLICT DO NOTHING if supported, or ignore error
                await prisma.$executeRaw`
                    INSERT INTO "_RolePermissions" ("A", "B")
                    VALUES (${perm.id}, ${saRole.id})
                    ON CONFLICT DO NOTHING
                `;
            } catch (e) {
                // Ignore unique constraint violation manually if ON CONFLICT syntax differs (though Postgres standard supports it)
            }
        }
        console.log('Linked all permissions to SUPER_ADMIN.');

        // Insert for ADMIN
        for (const perm of adminPerms) {
            try {
                await prisma.$executeRaw`
                    INSERT INTO "_RolePermissions" ("A", "B")
                    VALUES (${perm.id}, ${adminRole.id})
                    ON CONFLICT DO NOTHING
                `;
            } catch (e) {
            }
        }
        console.log('Linked permissions to ADMIN.');

    } catch (error) {
        console.error('Error fixing permissions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixPermissions();
