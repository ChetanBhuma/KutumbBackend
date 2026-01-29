
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    // 1. Find User
    const user = await prisma.user.findFirst({
        where: {
            email: {
                startsWith: 'acpsouth'
            }
        }
    });

    if (!user) {
        console.log("ACP user not found");
        return;
    }

    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Role Code on User: ${user.role}`);
    // Check if user has direct permissions (if field exists, otherwise ignore)
    // @ts-ignore
    if (user.permissions) {
         // @ts-ignore
        console.log(`Direct User Permissions:`, user.permissions);
    }

    // 2. Find Role Definition
    const roleDef = await prisma.role.findFirst({
        where: {
            OR: [
                { code: user.role },
                { name: user.role }
            ]
        }
    });

    if (roleDef) {
        console.log(`Role Definition Found: ${roleDef.name} (Code: ${roleDef.code})`);
        console.log(`Role Permissions:`, roleDef.permissions);
    } else {
        console.log(`No Role definition found for code/name: ${user.role}`);
        console.log("Check if 'Role' table has this role code.");
    }

  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
