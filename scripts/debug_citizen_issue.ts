
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCitizen() {
    try {
        const citizens = await prisma.seniorCitizen.findMany({
            where: {
                fullName: {
                    contains: 'Test Citizen South'
                }
            }
        });

        console.log('Found citizens:', JSON.stringify(citizens, null, 2));

        // Also check approved citizens counts
        const approvedCount = await prisma.seniorCitizen.count({
            where: { idVerificationStatus: 'Verified' }
        });
        const approvedAndActiveCount = await prisma.seniorCitizen.count({
            where: { idVerificationStatus: 'Verified', status: 'Active' }
        });

        console.log(`Verified Total: ${approvedCount}`);
        console.log(`Verified & Active: ${approvedAndActiveCount}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCitizen();
