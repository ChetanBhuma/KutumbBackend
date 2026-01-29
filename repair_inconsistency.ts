
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repairData() {
    try {
        const citizenId = 'cmjicozpr0001tvubw2qr6cjb'; // From previous output

        console.log(`Reparing citizen: ${citizenId}`);

        const updated = await prisma.seniorCitizen.update({
            where: { id: citizenId },
            data: {
                status: 'Verified',
                idVerificationStatus: 'Verified', // Correct Enum
                officialRemarks: 'Approved by Admin (Repaired)',
                digitalCardIssued: true,
                digitalCardNumber: `SCID-${Date.now()}-REPAIRED`,
                digitalCardIssueDate: new Date()
            }
        });

        console.log('Repair successful:', updated);

    } catch (error) {
        console.error('Repair failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

repairData();
