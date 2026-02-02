
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkColumn() {
    try {
        const result = await prisma.$queryRaw`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='Role' AND column_name='jurisdictionLevel';
        `;
        console.log('Column Check Result:', result);
    } catch (error) {
        console.error('Error checking column:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkColumn();
