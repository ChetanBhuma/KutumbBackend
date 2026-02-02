
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllRoles() {
    try {
        const roles = await prisma.role.findMany();
        console.log('All Roles in DB:', roles.length);
        console.log(JSON.stringify(roles, null, 2));
    } catch (error) {
        console.error('Error checking roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllRoles();
