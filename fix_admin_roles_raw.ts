
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function fixRoles() {
    console.log('Fixing Admin Roles via Raw SQL...');

    const roles = [
        {
            code: 'SUPER_ADMIN',
            name: 'Super Administrator',
            description: 'Full system access',
            jurisdictionLevel: 'ALL'
        },
        {
            code: 'ADMIN',
            name: 'Administrator',
            description: 'Administrative access',
            jurisdictionLevel: 'ALL'
        }
    ];

    try {
        for (const role of roles) {
            // Check if exist
            const existing = await prisma.$queryRaw<any[]>`SELECT id FROM "Role" WHERE code = ${role.code}`;

            if (existing && existing.length > 0) {
                console.log(`Updating existing role: ${role.code}`);
                await prisma.$executeRaw`
                    UPDATE "Role"
                    SET "jurisdictionLevel" = ${role.jurisdictionLevel}
                    WHERE code = ${role.code}
                `;
            } else {
                console.log(`Creating new role: ${role.code}`);
                const newId = randomUUID(); // Use UUID as generic unique ID since CUID gen is not available
                // Note: Providing 'permissions' logic might be complex in raw SQL due to relation.
                // For now, just ensuring the Role exists with correct jurisdiction level so middleware passes.
                // Permission relation population is separate.
                await prisma.$executeRaw`
                    INSERT INTO "Role" (id, code, name, description, "jurisdictionLevel", "isActive", "updatedAt")
                    VALUES (${newId}, ${role.code}, ${role.name}, ${role.description}, ${role.jurisdictionLevel}, true, NOW())
                `;
            }
        }
        console.log('Roles processed successfully.');

        // Verify
        const verify = await prisma.$queryRaw`SELECT code, "jurisdictionLevel" FROM "Role" WHERE code IN ('SUPER_ADMIN', 'ADMIN')`;
        console.log('Verification:', verify);

    } catch (error) {
        console.error('Error fixing roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixRoles();
