
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugQuery() {
    console.log('🚀 Debugging Prisma Query...');
    try {
        const users = await prisma.user.findMany({
            take: 1,
            include: {
                SeniorCitizen: {
                    select: {
                        id: true,
                        fullName: true,
                        mobileNumber: true,
                        permanentAddress: true,
                        vulnerabilityLevel: true,
                    }
                }
            }
        });
        console.log('✅ Query Successful!');
        console.log('Result sample:', JSON.stringify(users[0], null, 2));
    } catch (error) {
        console.error('❌ Query Failed!');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

debugQuery();
