
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoles() {
    try {
        const roles = await prisma.role.findMany({
            where: {
                code: { in: ['SUPER_ADMIN', 'ADMIN'] }
            }
        });
        console.log('Role Configuration:');
        console.log(JSON.stringify(roles, null, 2));
    } catch (error) {
        console.error('Error checking roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRoles();
