
import { prisma } from './src/config/database';
import { OfficerAssignmentService } from './src/services/officerAssignmentService';

async function fixAssignment() {
    try {
        const mobile = '+917889785489';
        console.log(`Fixing assignment for citizen with mobile: ${mobile}`);

        const citizen = await prisma.seniorCitizen.findUnique({
            where: { mobileNumber: mobile },
            include: { Beat: true, PoliceStation: true }
        });

        if (!citizen) {
            console.log('Citizen not found.');
            return;
        }

        if (!citizen.beatId) {
            console.log('Citizen has no beat assigned. Cannot assign officer.');
            // Attempt to resolve beat from police station if possible logic exists, but for now skip.
            return;
        }

        console.log(`Assigning officer for Beat: ${citizen.Beat?.name} (${citizen.beatId})`);
        const assignedOfficerId = await OfficerAssignmentService.assignOfficerToCitizen(
            citizen.id,
            citizen.beatId,
            citizen.policeStationId || undefined
        );

        if (!assignedOfficerId) {
            console.log('No suitable officer found in this beat.');
            return;
        }

        console.log(`Assigned Officer ID: ${assignedOfficerId}`);

        // Update citizen
        await prisma.seniorCitizen.update({
            where: { id: citizen.id },
            data: {
                // beatOfficerId: assignedOfficerId // beatOfficerId field is missing in schema based on error logs?
                // Wait, schema says relation is via Beat.
                // SeniorCitizen has no direct relation to Officer in schema provided?
                // Let's check schema again. schema.prisma:310 SeniorCitizen
                // It has Beat relation. Beat has BeatOfficer.
                // The assignment is usually tracked via VISIT.
            }
        });

        // Create Verification Visit
        const visit = await prisma.visit.create({
            data: {
                seniorCitizenId: citizen.id,
                officerId: assignedOfficerId,
                policeStationId: citizen.policeStationId!,
                visitType: 'Verification',
                status: 'SCHEDULED',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
                notes: 'Manual fix: Auto-scheduled verification visit'
            }
        });

        console.log(`Verification Visit Created: ${visit.id}`);
        console.log('Done.');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fixAssignment();
