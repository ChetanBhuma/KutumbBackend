import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRoles() {
    try {
        console.log("Fetching all roles...");
        const roles = await prisma.role.findMany();
        console.log("Roles found:", JSON.stringify(roles, null, 2));

        const shoRole = roles.find(r => r.code === 'SHO');
        if (shoRole) {
            console.log("\nSHO Role Details:");
            console.log("Code:", shoRole.code);
            // @ts-ignore
            console.log("Jurisdiction Level:", shoRole.jurisdictionLevel);
        } else {
            console.log("SHO Role NOT found.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRoles();
