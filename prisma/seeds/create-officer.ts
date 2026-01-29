import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const mobile = '+918882526943';
    // Check with and without +91 just in case
    const citizen = await prisma.seniorCitizen.findFirst({
        where: {
            OR: [
                { mobileNumber: mobile },
                { mobileNumber: mobile.replace('+91', '') },
                { mobileNumber: '8882526943' }
            ]
        },
        include: {
            PoliceStation: true,
            District: true
        }
    });

    if (!citizen) {
        console.error(`Citizen with mobile ${mobile} not found.`);
        return;
    }

    console.log(`Found Citizen: ${citizen.fullName}`);
    console.log(`Police Station ID: ${citizen.policeStationId}`);
    console.log(`District ID: ${citizen.districtId}`);

    if (!citizen.policeStationId) {
        console.error('Citizen is not assigned to any Police Station. Cannot create officer in the same location.');
        console.log('Attempting to find a station based on address text if possible? (Skipping for now)');
        return;
    }

    const policeStationId = citizen.policeStationId;

    // Create Officer
    const badgeNumber = `OFF-${Math.floor(1000 + Math.random() * 9000)}`;
    const officerName = `Officer for ${citizen.PoliceStation?.name || 'Assigned Station'}`;
    const officerMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`; // Random 10 digit

    const officer = await prisma.beatOfficer.create({
        data: {
            name: officerName,
            rank: 'Sub-Inspector',
            badgeNumber: badgeNumber,
            mobileNumber: officerMobile,
            policeStationId: policeStationId,
            isActive: true,
            // Beat ID is optional, we leave it null for now or find a beat in this station?
            // Let's see if we can find a beat.
        }
    });

    console.log(`\nSUCCESS: Created Beat Officer`);
    console.log(`Name: ${officer.name}`);
    console.log(`Badge Number: ${officer.badgeNumber}`);
    console.log(`Mobile: ${officer.mobileNumber}`);
    console.log(`Police Station: ${citizen.PoliceStation?.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
