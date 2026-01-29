
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
    try {
        const email = 'admin@delhipolice.gov.in';
        console.log(`Checking user: ${email}`);

        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            console.log('User not found!');
        } else {
            console.log('User found:', user);
            console.log('Role:', user.role);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
