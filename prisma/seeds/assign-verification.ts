import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const mobile = '+918882526943';
    // 1. Find the Citizen
    const citizen = await prisma.seniorCitizen.findFirst({
        where: {
            OR: [
                { mobileNumber: mobile },
                { mobileNumber: mobile.replace('+91', '') },
                { mobileNumber: '8882526943' }
            ]
        }
    });

    if (!citizen) {
        console.error(`Citizen with mobile ${mobile} not found.`);
        return;
    }
    console.log(`Found Citizen: ${citizen.fullName} (ID: ${citizen.id})`);

    // 2. Find the Officer
    const badgeNumber = 'OFF-4156';
    const officer = await prisma.beatOfficer.findUnique({
        where: { badgeNumber: badgeNumber }
    });

    if (!officer) {
        console.error(`Officer with badge ${badgeNumber} not found.`);
        return;
    }
    console.log(`Found Officer: ${officer.name} (ID: ${officer.id})`);

    // 3. Find or Create Verification Request
    // Check if a PENDING or IN_PROGRESS request exists
    let verificationRequest = await prisma.verificationRequest.findFirst({
        where: {
            seniorCitizenId: citizen.id,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
    });

    if (verificationRequest) {
        console.log(`Found existing Verification Request (ID: ${verificationRequest.id}), cleaning and reassigning...`);
        // Update
        const updated = await prisma.verificationRequest.update({
            where: { id: verificationRequest.id },
            data: {
                assignedTo: officer.id,
                assignedAt: new Date(),
                status: 'PENDING' // Per workflow: assigned but not started is PENDING
            }
        });
        console.log(`Successfully assigned existing request to Officer ${officer.badgeNumber}.`);
    } else {
        console.log('No active Verification Request found. Creating a NEW one...');
        const newRequest = await prisma.verificationRequest.create({
            data: {
                entityType: 'SeniorCitizen',
                entityId: citizen.id,
                seniorCitizenId: citizen.id,
                requestedBy: 'SYSTEM_SEED',
                status: 'PENDING',
                priority: 'High', // Urgent as per user request context
                assignedTo: officer.id, // Direct assignment
                assignedAt: new Date(),
                remarks: 'Manual assignment via seed script.'
            }
        });
        console.log(`Created and assigned NEW Verification Request (ID: ${newRequest.id}).`);
    }

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
