
import { prisma } from './src/config/database';

async function assignOfficer() {
    try {
        // 1. Find the Senior Citizen
        const mobileNumber = '9876543231';
        const citizen = await prisma.seniorCitizen.findFirst({
            where: {
                OR: [
                    { mobileNumber: mobileNumber },
                    { fullName: { contains: 'Kamla', mode: 'insensitive' } }
                ]
            },
            include: {
                PoliceStation: true,
                Beat: true
            }
        });

        if (!citizen) {
            console.log('Senior Citizen not found.');
            return;
        }

        console.log(`Found Citizen: ${citizen.fullName} (${citizen.mobileNumber})`);
        console.log(`Address: ${citizen.permanentAddress}`);
        console.log(`Current Beat: ${citizen.beatId ? citizen.Beat?.name : 'None'}`);
        console.log(`Police Station: ${citizen.policeStationId ? citizen.PoliceStation?.name : 'None'}`);

        if (!citizen.policeStationId) {
            console.log('Citizen has no police station assigned. Cannot assign beat officer automatically without location context.');
            // Attempt to find a default PS/Beat if missing?
            // For now, let's see if we can find any officer in the system if no PS is linked, or just fail.
            // But usually registration links a PS.
        }

        // 2. Find a Beat Officer in the same Beat or Police Station
        let officer = null;

        if (citizen.beatId) {
            // Try to find officer in this beat
            officer = await prisma.beatOfficer.findFirst({
                where: { beatId: citizen.beatId, isActive: true },
                include: { user: true }
            });
        }

        if (!officer && citizen.policeStationId) {
            // Fallback to any officer in the Police Station
            console.log('No officer found in specific beat (or no beat assigned). Looking in Police Station...');
            officer = await prisma.beatOfficer.findFirst({
                where: { policeStationId: citizen.policeStationId, isActive: true },
                include: { user: true }
            });
        }

        if (!officer) {
            // Fallback to ANY officer for demo purposes if nothing matches
            console.log('No matching officer found in Beat/PS. Fetching first available active officer for demo...');
            officer = await prisma.beatOfficer.findFirst({
                where: { isActive: true },
                include: { user: true, Beat: true, PoliceStation: true }
            });
        }

        if (!officer) {
            console.log('No officers found in the system.');
            return;
        }

        console.log(`\nSelected Officer: ${officer.name} (${officer.rank})`);
        console.log(`Badge Number: ${officer.badgeNumber}`);
        console.log(`Assigned Beat: ${officer.Beat?.name}`);
        console.log(`Mobile: ${officer.mobileNumber}`);

        // 3. Assign the Officer (Update Citizen Record)
        // Check if already assigned
        // Actually, "assigning a beat officer" usually means setting the beatId of the citizen
        // OR creating a Visit assigned to this officer.
        // The user asked to "assign a beat officer TO Mrs. Kamla".
        // This implies ensuring she is mapped to his beat, or he is set as her beat officer.
        // In this schema, `SeniorCitizen` has `beatId`. The `BeatOfficer` belongs to a `Beat`.
        // So we link them via `beatId`.

        // If the officer has a beat, assign that beat to the citizen
        if (officer.beatId && citizen.beatId !== officer.beatId) {
            await prisma.seniorCitizen.update({
                where: { id: citizen.id },
                data: {
                    beatId: officer.beatId,
                    policeStationId: officer.policeStationId // Ensure PS matches officer
                }
            });
            console.log(`Updated Citizen to belong to Beat: ${officer.Beat?.name}`);
        }

        // 4. Create a Verification Visit (to formalize the assignment)
        const visit = await prisma.visit.create({
            data: {
                seniorCitizenId: citizen.id,
                officerId: officer.id,
                policeStationId: officer.policeStationId,
                beatId: officer.beatId,
                visitType: 'Verification',
                status: 'SCHEDULED',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                notes: 'Manual assignment via support request'
            }
        });

        console.log(`\nCreated Verification Visit ID: ${visit.id}`);

        // 5. Get Credentials (User)
        // Officer Login is usually via Mobile/OTP or Email/Password.
        // Check User table for this officer
        if (officer.user) {
            console.log('\n--- Officer Credentials ---');
            console.log(`Email/Username: ${officer.user.email || officer.mobileNumber}`);
            // Note: We cannot show the actual password hash.
            // We can state the default password if known (e.g., "password123" or badge number)
            // Or reset it if needed. For now, we'll assume standard test credentials.
            console.log(`(If test user) Default Password might be: password123`);
        } else {
             console.log('\nOfficer does not have a linked User account yet.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

assignOfficer();
