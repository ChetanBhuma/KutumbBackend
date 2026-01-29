
import { prisma } from './src/config/database';

async function listRecent() {
    try {
        console.log('--- Recent Cancellations/Registrations ---');
        const regs = await prisma.citizenRegistration.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { mobileNumber: true, fullName: true, status: true, formCode: false } // formCode not in schema?
        });
        console.table(regs);

        console.log('\n--- Recent Senior Citizens ---');
        const citizens = await prisma.seniorCitizen.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { mobileNumber: true, fullName: true }
        });
        console.table(citizens);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
listRecent();
