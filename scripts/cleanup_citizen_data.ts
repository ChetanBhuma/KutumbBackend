
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupCitizenData() {
    console.log('Starting cleanup of citizen data...');

    try {
        // 1. Delete dependent transactional data first to avoid constraint issues

        console.log('Deleting Visit Feedback...');
        await prisma.visitFeedback.deleteMany({});

        console.log('Deleting Visits...');
        await prisma.visit.deleteMany({});

        console.log('Deleting Visit Requests...');
        await prisma.visitRequest.deleteMany({});

        console.log('Deleting Service Requests...');
        await prisma.serviceRequest.deleteMany({});

        console.log('Deleting SOS Location Updates...');
        await prisma.sOSLocationUpdate.deleteMany({});

        console.log('Deleting SOS Alerts...');
        await prisma.sOSAlert.deleteMany({});

        console.log('Deleting Verification Requests...');
        await prisma.verificationRequest.deleteMany({
            where: { entityType: 'SeniorCitizen' }
        });

        console.log('Deleting Vulnerability History...');
        await prisma.vulnerabilityHistory.deleteMany({});

        // 2. Delete Citizen Registrations and Auth
        console.log('Deleting Citizen Registrations...');
        await prisma.citizenRegistration.deleteMany({});

        console.log('Deleting Citizen Auth...');
        await prisma.citizenAuth.deleteMany({});

        // 3. Delete Senior Citizen records (This will cascade delete Family, Emergency, Docs, etc. due to schema)
        console.log('Deleting Senior Citizens...');
        const { count } = await prisma.seniorCitizen.deleteMany({});

        console.log(`Successfully deleted ${count} Senior Citizen records.`);

        // 4. Optional: Clean up Users with role CITIZEN if they exist and are orphaned
        // (Be careful if officers are also Users)
        console.log('Deleting Users with role CITIZEN...');
        await prisma.user.deleteMany({
            where: { role: 'CITIZEN' }
        });

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
        console.log('Cleanup complete.');
    }
}

cleanupCitizenData();
