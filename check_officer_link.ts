
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOfficerProfile() {
    try {
        const email = 'officer-range@delhipolice.gov.in'; // From the token we saw earlier

        console.log(`Checking user: ${email}`);
        const user = await prisma.user.findFirst({
            where: { email },
            include: {
                officerProfile: true
            }
        });

        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log(`User ID: ${user.id}`);
        console.log(`Role: ${user.role}`);

        if (user.officerProfile) {
            console.log('Officer Profile FOUND:');
            console.log(`- ID: ${user.officerProfile.id}`);
            console.log(`- Name: ${user.officerProfile.name}`);
            console.log(`- Badge: ${user.officerProfile.badgeNumber}`);
        } else {
            console.log('Officer Profile NOT FOUND (This causes the 404).');

            // Try to find if there is an unlinked officer profile
            console.log('Searching for unlinked BeatOfficer records...');
            const unlinkedOfficers = await prisma.beatOfficer.findMany({
                where: { userId: null },
                take: 5
            });
            console.log(`Found ${unlinkedOfficers.length} unlinked officers.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOfficerProfile();
