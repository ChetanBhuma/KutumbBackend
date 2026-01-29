
import { prisma } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function listRoles() {
    console.log('--- Listing Roles to File ---');
    const roles = await prisma.role.findMany({
        orderBy: { code: 'asc' }
    });

    const output = roles.map(r => `Role: ${r.code.padEnd(30)} Level: ${r.jurisdictionLevel}`).join('\n');

    fs.writeFileSync(path.join(__dirname, 'roles_output.txt'), output);
    console.log('Wrote roles to roles_output.txt');
}

listRoles().catch(console.error).finally(() => prisma.$disconnect());
