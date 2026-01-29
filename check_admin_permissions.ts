
import { PrismaClient } from '@prisma/client';
import { Role, Permission, hasPermission, RolePermissions } from './src/types/auth'; // Adjust path if needed

const prisma = new PrismaClient();

async function checkAdminPermissions() {
    try {
        console.log('--- Checking Admin User Permissions ---');
        const email = 'admin@delhipolice.gov.in';

        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            console.log('Admin user not found.');
            return;
        }

        console.log(`User: ${user.email}`);
        console.log(`Role in DB: '${user.role}'`);

        const roleEnum = user.role as Role;
        console.log(`Role Enum: '${roleEnum}'`);

        // Check Permissions directly
        const requiredPermission = Permission.CITIZENS_WRITE;
        console.log(`Required Permission: '${requiredPermission}'`);

        const hasIt = hasPermission(roleEnum, requiredPermission);
        console.log(`hasPermission('${roleEnum}', '${requiredPermission}') = ${hasIt}`);

        // Dump verify
        const permissions = RolePermissions[roleEnum];
        if (permissions) {
             console.log('Available Permissions:', permissions);
             console.log('Includes write?', permissions.includes(requiredPermission));
        } else {
             console.log('No permissions found for this role!');
        }

        if (hasIt) {
            console.log('SUCCESS: Admin has correct permissions in Backend logic.');
        } else {
            console.log('FAILURE: Admin user MISSING permissions in logic.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminPermissions();
