import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCitizens() {
    try {
        const count = await prisma.seniorCitizen.count();
        console.log(`Total Senior Citizens in DB: ${count}`);

        if (count > 0) {
            const citizens = await prisma.seniorCitizen.findMany({
                take: 5,
                select: {
                    id: true,
                    fullName: true,
                    mobileNumber: true,
                    isActive: true,
                    idVerificationStatus: true
                }
            });
            console.log('First 5 citizens:', citizens);
        }
    } catch (error) {
        console.error('Error checking citizens:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCitizens();
