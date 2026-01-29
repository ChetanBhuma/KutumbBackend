
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCitizen() {
    try {
        const citizens = await prisma.seniorCitizen.findMany({
            where: {
                fullName: {
                    contains: 'Test Citizen South'
                }
            },
            select: {
                id: true,
                fullName: true,
                isActive: true,
                status: true,
                idVerificationStatus: true,
                digitalCardIssued: true
            }
        });

        console.log('Found citizens:', JSON.stringify(citizens, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCitizen();
