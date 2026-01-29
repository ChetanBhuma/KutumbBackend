
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectUserClean() {
    const email = 'acp@gmail.com';
    console.log(`\n\n🔍 INSPECTING USER: ${email}`);
    console.log('='.repeat(50));

    try {
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            console.log('🚩 User NOT FOUND');
            return;
        }

        console.log(`👤 User ID: ${user.id}`);
        console.log(`📧 Email:  ${user.email}`);
        console.log(`🎭 Role on User: '${user.role}'`); // Enforce quotes to see whitespace

        if (!user.role) {
            console.log('⚠️ No role assigned');
            return;
        }

        const role = await prisma.role.findUnique({
            where: { code: user.role }
        });

        if (!role) {
            console.log(`❌ Role '${user.role}' NOT FOUND in Role table!`);

            // Try partial match to debug case issues
            const allRoles = await prisma.role.findMany({ select: { code: true } });
            console.log('ℹ️ Available Roles:', allRoles.map(r => r.code).join(', '));
            return;
        }

        console.log(`✅ Role Found: '${role.code}'`);
        console.log(`📝 Permissions (${role.permissions.length}):`);
        console.log(JSON.stringify(role.permissions, null, 2));

    } catch (error) {
        console.error('CRASH:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectUserClean();
