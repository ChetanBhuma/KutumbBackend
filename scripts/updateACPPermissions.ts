
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePermissions() {
  try {
    const roleCode = 'ACP';
    const permissionToAdd = 'citizens.write';

    const role = await prisma.role.findFirst({
        where: { code: roleCode }
    });

    if (!role) {
        console.log("Role ACP not found");
        return;
    }

    console.log(`Current permissions:`, role.permissions);

    if (!role.permissions.includes(permissionToAdd)) {
        const updatedPermissions = [...role.permissions, permissionToAdd];
        await prisma.role.update({
            where: { id: role.id },
            data: { permissions: updatedPermissions }
        });
        console.log(`Added ${permissionToAdd}. New permissions:`, updatedPermissions);
    } else {
        console.log(`${permissionToAdd} already exists.`);
    }

  } catch (error) {
    console.error('Error updating permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePermissions();
