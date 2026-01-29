import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of citizen data...');

  try {
    // Delete related tables first (if cascade setup is incomplete, but typically SeniorCitizen handles it)
    // However, Prisma deleteMany on SeniorCitizen with cascade should work.
    // Let's be safe and try deleting SeniorCitizen.

    // Note: Due to foreign key constraints, we might need to delete Visit, ServiceRequest, etc. first
    // if cascade isn't perfect. But checking schema.prisma, most use onDelete: Cascade.

    // Deleting Visits first just in case
    await prisma.visitFeedback.deleteMany({});
    await prisma.visit.deleteMany({});
    console.log('Deleted all Visits.');

    // Delete Service Requests & Verifications
    await prisma.serviceRequest.deleteMany({});
    await prisma.visitRequest.deleteMany({});
    await prisma.verificationRequest.deleteMany({});

    // Delete SOS Alerts & Locations
    await prisma.sOSLocationUpdate.deleteMany({});
    await prisma.sOSAlert.deleteMany({});

    // Delete Auth & registration tracking
    await prisma.citizenAuth.deleteMany({});
    await prisma.citizenRegistration.deleteMany({});
    await prisma.spouseDetails.deleteMany({});
    await prisma.vulnerabilityHistory.deleteMany({});
    await prisma.medicalHistory.deleteMany({});
    await prisma.document.deleteMany({});

    // Delete Relations just in case cascade is off
    await prisma.familyMember.deleteMany({});
    await prisma.emergencyContact.deleteMany({});
    await prisma.householdHelp.deleteMany({});

    // Delete Service Requests
    await prisma.serviceRequest.deleteMany({});
    console.log('Deleted all Service Requests.');

    // Delete SOS Alerts
    await prisma.sOSAlert.deleteMany({});
    console.log('Deleted all SOS Alerts.');

    // Now delete Senior Citizens
    // This should cascade to FamilyMember, EmergencyContact, HouseholdHelp, Documents etc.
    const deleted = await prisma.seniorCitizen.deleteMany({});

    console.log(`Successfully deleted ${deleted.count} Senior Citizen records.`);

  } catch (error) {
    console.error('Error deleting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
