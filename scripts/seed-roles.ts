import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRoles() {
    console.log(' Seeding roles and permissions...\\n');

    try {
        // Define roles with their permissions
        const roleDefinitions = [
            {
                code: 'SUPER_ADMIN',
                name: 'Super Administrator',
                description: 'Full system access with all permissions',
                permissions: [
                    'users:read', 'users:write', 'users:delete',
                    'roles:read', 'roles:write', 'roles:delete',
                    'citizens:read', 'citizens:write', 'citizens:delete',
                    'officers:read', 'officers:write', 'officers:delete',
                    'masters:read', 'masters:write', 'masters:delete',
                    'reports:read', 'reports:write',
                    'settings:read', 'settings:write',
                    'audit:read'
                ],
                isActive: true
            },
            {
                code: 'ADMIN',
                name: 'District Administrator',
                description: 'District-level administrative access',
                permissions: [
                    'users:read', 'users:write',
                    'roles:read',
                    'citizens:read', 'citizens:write',
                    'officers:read', 'officers:write',
                    'masters:read',
                    'reports:read', 'reports:write',
                    'audit:read'
                ],
                isActive: true
            },
            {
                code: 'OFFICER',
                name: 'Beat Officer',
                description: 'Field officer with limited access',
                permissions: [
                    'citizens:read', 'citizens:write',
                    'visits:read', 'visits:write',
                    'sos:read', 'sos:write'
                ],
                isActive: true
            },
            {
                code: 'SUPERVISOR',
                name: 'Supervisor',
                description: 'Supervisory role for monitoring',
                permissions: [
                    'citizens:read',
                    'officers:read',
                    'reports:read',
                    'audit:read'
                ],
                isActive: true
            },
            {
                code: 'CITIZEN',
                name: 'Citizen',
                description: 'Senior citizen portal access',
                permissions: [
                    'profile:read', 'profile:write',
                    'sos:write',
                    'requests:read', 'requests:write'
                ],
                isActive: true
            }
        ];

        // Upsert each role
        for (const roleDef of roleDefinitions) {
            const role = await prisma.role.upsert({
                where: { code: roleDef.code },
                update: {
                    name: roleDef.name,
                    description: roleDef.description,
                    permissions: roleDef.permissions,
                    isActive: roleDef.isActive
                },
                create: roleDef
            });

            console.log(` ${role.name} (${role.code})`);
            console.log(`   Permissions: ${role.permissions.length} total`);
        }

        console.log('\\n🎉 Roles seeded successfully!\\n');

        // Display summary
        const allRoles = await prisma.role.findMany({
            where: { isActive: true }
        });

        console.log('═══════════════════════════════════════════════');
        console.log(' ACTIVE ROLES SUMMARY');
        console.log('═══════════════════════════════════════════════');
        for (const role of allRoles) {
            console.log(`\\n${role.name} (${role.code})`);
            console.log(`Description: ${role.description || 'N/A'}`);
            console.log(`Permissions: ${role.permissions.join(', ')}`);
        }
        console.log('\\n═══════════════════════════════════════════════\\n');

    } catch (error) {
        console.error(' Error seeding roles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedRoles()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
