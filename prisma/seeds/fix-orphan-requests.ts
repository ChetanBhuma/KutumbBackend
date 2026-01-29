
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Orphan Verification Request Fix...');

    // Find VerificationRequests that are IN_PROGRESS or PENDING and assigned, but have no corresponding Visit
    // Logic: Find all Requests. For each, check if a Visit exists with same citizen/officer/type='Verification'.
    // If not, create it.

    const requests = await prisma.verificationRequest.findMany({
        where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            assignedTo: { not: null }
        },
        include: { seniorCitizen: true }
    });

    console.log(`Found ${requests.length} active assigned requests.`);

    let fixedCount = 0;

    for (const req of requests) {
        // Check for existing visit
        const existingVisit = await prisma.visit.findFirst({
            where: {
                seniorCitizenId: req.seniorCitizenId,
                officerId: req.assignedTo!,
                visitType: 'Verification',
                status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] }
            }
        });

        if (!existingVisit) {
            console.log(`Fixing Request ID: ${req.id} for Citizen: ${req.seniorCitizen.fullName}`);

            // Get Officer Details for Station/Beat
            const officer = await prisma.beatOfficer.findUnique({
                where: { id: req.assignedTo! }
            });

            if (officer) {
                const visit = await prisma.visit.create({
                    data: {
                        seniorCitizenId: req.seniorCitizenId,
                        officerId: req.assignedTo!,
                        policeStationId: officer.policeStationId,
                        beatId: officer.beatId || req.seniorCitizen.beatId,
                        visitType: 'Verification',
                        status: req.status === 'PENDING' ? 'SCHEDULED' : 'IN_PROGRESS',
                        scheduledDate: req.assignedAt || req.createdAt,
                        priority: req.priority
                    }
                });
                console.log(` -> Created Visit ID: ${visit.id}`);
                fixedCount++;
            } else {
                console.warn(` -> Officer not found for ID: ${req.assignedTo}`);
            }
        } else {
            console.log(`Request ${req.id} already has visit ${existingVisit.id}. Safe.`);
        }
    }

    console.log(`Fix Complete. Created ${fixedCount} visits.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
