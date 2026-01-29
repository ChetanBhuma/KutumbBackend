import { PrismaClient } from '@prisma/client';
import { RolePermissions, Role, Permission } from '../src/types/auth'; // Adjust path if needed

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Syncing Roles and Permissions...');

    const roles = Object.keys(RolePermissions) as Role[];

    for (const roleCode of roles) {
        const permissions = RolePermissions[roleCode];

        console.log(`Processing role: ${roleCode}`);

        await prisma.role.upsert({
            where: { code: roleCode },
            update: {
                // If it exists, we update permissions to match the code source of truth
                // This ensures we don't have drift between code and DB
                permissions: permissions,
                name: roleCode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) // "SUPER_ADMIN" -> "Super Admin"
            },
            create: {
                code: roleCode,
                name: roleCode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                permissions: permissions,
                description: `System role for ${roleCode}`,
                isActive: true
            }
        });
    }

    console.log('✅ Roles Synced Successfully!');

    // Optional: Log all available unique permissions for reference
    const allPermissions = Object.values(Permission);
    console.log(`ℹ️  Total System Permissions: ${allPermissions.length}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
