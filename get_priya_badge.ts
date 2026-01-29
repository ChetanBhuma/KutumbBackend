
import { prisma } from './src/config/database';

async function getBadgeNumber() {
    try {
        const officer = await prisma.beatOfficer.findFirst({
            where: {
                name: 'Constable Priya Sharma'
            },
            select: {
                name: true,
                badgeNumber: true,
                mobileNumber: true
            }
        });

        if (officer) {
            console.log(`\n--- DETAILS FOR LOGIN ---`);
            console.log(`Name: ${officer.name}`);
            console.log(`Badge Number: ${officer.badgeNumber}`);
            console.log(`Mobile: ${officer.mobileNumber}`);
            console.log(`-------------------------`);
        } else {
            console.log('Officer not found.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

getBadgeNumber();
