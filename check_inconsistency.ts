
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataState() {
    try {
        const registrationId = 'cmjicozq20003tvub2nj3p3d9';

        const registration = await prisma.citizenRegistration.findUnique({
            where: { id: registrationId },
            include: { citizen: true }
        });

        if (!registration) {
            console.log('Registration not found');
            return;
        }

        console.log('--- Registration ---');
        console.log(`ID: ${registration.id}`);
        console.log(`Status: ${registration.status}`);

        if (registration.citizen) {
            console.log('--- Citizen ---');
            console.log(`ID: ${registration.citizen.id}`);
            console.log(`Status: ${registration.citizen.status}`);
            console.log(`ID Verification: ${registration.citizen.idVerificationStatus}`); // Expecting 'Pending' if crash happened
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDataState();
