import prisma from '../src/config/prisma';
import { PasswordService } from '../src/services/passwordService';

async function findOrResetAdmin() {
    try {
        console.log("Searching for existing Admin...");

        // Try to find Super Admin first, then Admin
        let admin = await prisma.user.findFirst({
            where: {
                role: { in: ['SUPER_ADMIN', 'ADMIN'] }
            }
        });

        const defaultPassword = 'ChangeMe@123';
        const passwordHash = await PasswordService.hash(defaultPassword);

        if (admin) {
            console.log(`Found existing Admin: ${admin.email}`);
            console.log("Resetting password...");

            await prisma.user.update({
                where: { id: admin.id },
                data: { passwordHash }
            });

            console.log(`CREDENTIALS: ${admin.email} / ${defaultPassword}`);
        } else {
            console.log("No Admin found. Creating new Super Admin...");
            const email = 'admin@delhipolice.gov.in';
            const phone = '9999999999';

            admin = await prisma.user.create({
                data: {
                    email,
                    phone,
                    passwordHash,
                    role: 'SUPER_ADMIN',
                    isActive: true
                }
            });

            console.log(`CREATED CREDENTIALS: ${email} / ${defaultPassword}`);
        }

    } catch (error) {
        console.error("Error managing admin credentials:", error);
    } finally {
        await prisma.$disconnect();
    }
}

findOrResetAdmin();
