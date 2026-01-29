
import { prisma } from './src/config/database';
import bcrypt from 'bcryptjs';

async function createOfficerCredentials() {
    try {
        // 1. Find Constable Priya Sharma
        const officer = await prisma.beatOfficer.findFirst({
            where: {
                name: 'Constable Priya Sharma',
                rank: 'Constable'
            }
        });

        if (!officer) {
            console.log('Officer Priya Sharma not found!');
            return;
        }

        console.log(`Found Officer: ${officer.name} (ID: ${officer.id})`);

        // 2. Check if a User already exists for this officer (maybe by email match?)
        // Construct a likely email
        const email = `priya.sharma@delhipolice.gov.in`;

        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            console.log('User already exists for this email.');
        } else {
            console.log('Creating new User account...');
            const hashedPassword = await bcrypt.hash('password123', 10);

            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'OFFICER',
                    name: officer.name
                }
            });
            console.log('User created.');
        }

        // 3. Link User to BeatOfficer
        // Check if officer already has userId set?
        // Note: Check if 'userId' is a field on BeatOfficer or if 'beatOfficer' is a relation on User.
        // Based on previous controller view (ensureOfficerAccess), it does:
        // prisma.beatOfficer.findFirst({ where: { user: { id: req.user.id } } })
        // This implies BeatOfficer has a 'userId' field or User has a One-to-One with BeatOfficer.

        // Let's try updating BeatOfficer with userId
        // (Assuming schema has userId on BeatOfficer, or we try to connect from User side if reversed)

        // Let's inspect schema structure by trying to update userId on BeatOfficer
        try {
            await prisma.beatOfficer.update({
                where: { id: officer.id },
                data: {
                    user: {
                        connect: { id: user.id }
                    }
                }
            });
            console.log('Linked Officer to User account.');
        } catch (linkError) {
            console.log('Failed to link via beatOfficer.update. Trying reverse link (if schema differs)...');
            // Sometimes schema is reversed, but usually User -> Profile is 1:1.
            // If BeatOfficer has 'userId' FK, the above 'connect' works.
            console.error(linkError);
        }

        console.log('\n--- CREDENTIALS ---');
        console.log(`Email: ${email}`);
        console.log(`Password: password123`);
        console.log(`Badge Number: ${officer.badgeNumber || 'N/A'}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

createOfficerCredentials();
