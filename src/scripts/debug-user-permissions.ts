
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectUser() {
    const email = 'acp@gmail.com';
    console.log(`🚀 Inspecting user: ${email}...`);

    try {
        const user = await prisma.user.findFirst({
            where: { email },
            include: {
                // We know from previous steps that the relation might be 'roleDetails' or we need to fetch Role separately if it's just a string field
                // Based on schema it seems 'role' is a String field on User, and there is a 'Role' model.
                // Let's rely on looking up the Role model by the code stored in user.role
            }
        });

        if (!user) {
            console.error('❌ User not found!');
            return;
        }

        console.log('User found:', {
            id: user.id,
            email: user.email,
            roleCode: user.role,
            isActive: user.isActive
        });

        if (user.role) {
            const role = await prisma.role.findUnique({
                where: { code: user.role }
            });

            if (role) {
                console.log('✅ Role found:', role);
                console.log('Permissions:', role.permissions);
            } else {
                console.error(`❌ Role definition for code '${user.role}' NOT FOUND in Role table.`);
            }
        } else {
            console.warn('⚠️ User has no role assigned.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectUser();
