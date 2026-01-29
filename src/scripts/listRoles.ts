
import { prisma } from '../config/database';

async function listRoles() {
    console.log('--- Listing Roles ---');
    const roles = await prisma.role.findMany({
        orderBy: { code: 'asc' }
    });
    roles.forEach(r => {
        console.log(`Role: ${r.code.padEnd(20)} Level: ${r.jurisdictionLevel}`);
    });
}

listRoles().catch(console.error).finally(() => prisma.$disconnect());
