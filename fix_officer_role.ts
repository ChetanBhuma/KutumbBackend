
import { prisma } from './src/config/database';

async function fixOfficerRole() {
    try {
        const user = await prisma.user.findFirst({
            where: { phone: '9876543211' }
        });

        console.log('Current User Details:', user);

        if (user && user.role !== 'OFFICER') {
            console.log(`Updating role from ${user.role} to OFFICER...`);
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'OFFICER' }
            });
            console.log('Role updated successfully.');
        } else {
            console.log('User already has OFFICER role or not found.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fixOfficerRole();
