
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
    try {
        const roleCode = 'ACP'; // Check this specific role
        console.log(`Checking permissions for role: ${roleCode}`);

        const role = await prisma.role.findUnique({
            where: { code: roleCode },
            include: {
                permissions: true // If permissions are a relation (which they are NOT in your schema, they are a string array)
            }
        });

        if (!role) {
            console.log(`Role '${roleCode}' not found!`);
        } else {
            console.log(`Role found: ${role.name} (${role.code})`);
            console.log('Permissions:', role.permissions);

            // Explicitly check for citizens.read
            if (Array.isArray(role.permissions)) {
                const hasRead = role.permissions.includes('citizens.read');
                console.log(`Has 'citizens.read': ${hasRead}`);

                // Check if any whitespace issues
                const trimmedPermissions = role.permissions.map(p => `'${p}'`);
                console.log('Formatted Permissions:', trimmedPermissions.join(', '));
            } else {
                console.log('Permissions field is not an array:', role.permissions);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPermissions();
