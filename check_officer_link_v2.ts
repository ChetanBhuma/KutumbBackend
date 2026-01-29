
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOfficerProfile() {
    try {
        const email = 'officer-range@delhipolice.gov.in';

        console.log(`Checking user: ${email}`);
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log(`User ID: ${user.id}`);
        console.log(`Role: ${user.role}`);
        console.log(`Officer ID (Foreign Key): ${user.officerId}`);

        if (user.officerId) {
            const officer = await prisma.beatOfficer.findUnique({
                where: { id: user.officerId }
            });
            if (officer) {
                 console.log(`Linked Officer Found: ${officer.name} (${officer.badgeNumber})`);
            } else {
                 console.log('Linked Officer ID exists in User, but BeatOfficer record NOT found.');
            }
        } else {
            console.log('User has NO Officer ID linked (Causes 404 in controller).');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOfficerProfile();
