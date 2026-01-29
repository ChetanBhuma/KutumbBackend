const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCitizen() {
    try {
        const id = 'cmjh1c27t0000edm0q6f2gbqx'; // ID from user request
        const citizen = await prisma.seniorCitizen.findUnique({
            where: { id },
            select: { id: true, fullName: true, photoUrl: true }
        });
        console.log('Citizen:', citizen);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCitizen();
