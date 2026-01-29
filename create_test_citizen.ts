
import { prisma } from './src/config/database';
import { OfficerAssignmentService } from './src/services/officerAssignmentService';

async function createTestCitizen() {
    try {
        // defined IDs from previous step
        const districtId = 'cmjcsxehl0001ocajy8s6nqvp'; // South Delhi
        const psId = 'cmjcsxehs0006ocaj04y9geiy';      // Saket PS
        const beatId = 'cmjcsxei0000docajh8hnecmd';     // Saket Beat 1

        const mobile = '+919999988888';
        const name = 'Test Citizen South';

        console.log(`Creating test citizen: ${name} (${mobile})...`);

        // Check if exists
        const existing = await prisma.seniorCitizen.findUnique({ where: { mobileNumber: mobile } });
        if (existing) {
            console.log('Citizen already exists, cleaning up...');
            await prisma.visit.deleteMany({ where: { seniorCitizenId: existing.id } });
            await prisma.seniorCitizen.delete({ where: { id: existing.id } });
            // Cleanup registration too if needed
             try {
                await prisma.citizenRegistration.delete({ where: { mobileNumber: mobile } });
            } catch (e) {}
        }

        // 1. Create Senior Citizen with Profile Completed
        const citizen = await prisma.seniorCitizen.create({
            data: {
                fullName: name,
                mobileNumber: mobile,
                dateOfBirth: new Date('1955-01-01'),
                age: 70,
                gender: 'Male',
                permanentAddress: 'H-123, Saket Block J',
                addressLine1: 'H-123',
                addressLine2: 'Saket',
                city: 'New Delhi',
                state: 'Delhi',
                pinCode: '110017',
                districtId: districtId,
                policeStationId: psId,
                beatId: beatId,
                status: 'Verified', // Assume verified for this test or Pending
                isMobileRegistered: true,
                isActive: true,
                vulnerabilityLevel: 'Moderate',
                idVerificationStatus: 'Pending'
            }
        });

        console.log(`Citizen created: ${citizen.id}`);

        // 2. Create Registration Record
        await prisma.citizenRegistration.create({
            data: {
                mobileNumber: mobile,
                fullName: name,
                status: 'PENDING_REVIEW', // Correct Enum Value
                registrationStep: 'COMPLETE',
                otpVerified: true,
                citizenId: citizen.id
            }
        });

        // 3. Assign Officer using Service
        console.log('Assigning Beat Officer...');
        const officerId = await OfficerAssignmentService.assignOfficerToCitizen(citizen.id, beatId, psId);

        if (officerId) {
             console.log(`Officer Assigned: ${officerId}`);

             // 4. Create Verification Visit
             await prisma.visit.create({
                data: {
                    seniorCitizenId: citizen.id,
                    officerId: officerId,
                    policeStationId: psId,
                    beatId: beatId,
                    visitType: 'Verification',
                    status: 'SCHEDULED', // Visible to officer
                    scheduledDate: new Date(Date.now() + 24*60*60*1000),
                    notes: 'Initial Verification Visit'
                }
             });
             console.log('Verification Visit Scheduled.');
        } else {
            console.error('Failed to assign officer! Are there officers in this beat?');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
createTestCitizen();
