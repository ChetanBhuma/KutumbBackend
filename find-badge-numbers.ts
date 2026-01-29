
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const officers = await prisma.beatOfficer.findMany({
        select: {
            badgeNumber: true,
            email: true,
            mobileNumber: true,
            user: {
                select: {
                    email: true
                }
            }
        }
    });
    console.log(JSON.stringify(officers, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
