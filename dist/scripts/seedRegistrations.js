"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedRegistrations() {
    console.log('🌱 Starting to seed citizen registrations...');
    try {
        // Get some existing citizens to link registrations
        const citizens = await prisma.seniorCitizen.findMany({
            take: 20,
            include: {
                PoliceStation: true,
                Beat: true,
            }
        });
        if (citizens.length === 0) {
            console.log('⚠️  No citizens found. Please run seedCitizensWithCoordinates.ts first.');
            return;
        }
        // Create registrations with different statuses
        const statuses = ['IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];
        for (let i = 0; i < citizens.length; i++) {
            const citizen = citizens[i];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            // For some citizens, create a registration
            if (Math.random() > 0.3) { // 70% chance
                await prisma.citizenRegistration.create({
                    data: {
                        mobileNumber: citizen.mobileNumber,
                        fullName: citizen.fullName,
                        otpVerified: true,
                        status: status,
                        registrationStep: status === 'IN_PROGRESS' ? 'PERSONAL_DETAILS' : 'COMPLETED',
                        citizenId: status !== 'IN_PROGRESS' ? citizen.id : undefined,
                        draftData: {
                            fullName: citizen.fullName,
                            dateOfBirth: citizen.dateOfBirth,
                            age: citizen.age,
                            gender: citizen.gender,
                            mobileNumber: citizen.mobileNumber,
                            permanentAddress: citizen.permanentAddress,
                            pinCode: citizen.pinCode,
                            policeStationId: citizen.policeStationId,
                            beatId: citizen.beatId,
                        }
                    }
                });
                console.log(`✅ Created registration for ${citizen.fullName} - Status: ${status}`);
            }
        }
        const totalRegistrations = await prisma.citizenRegistration.count();
        const pendingCount = await prisma.citizenRegistration.count({ where: { status: 'PENDING_REVIEW' } });
        const approvedCount = await prisma.citizenRegistration.count({ where: { status: 'APPROVED' } });
        const rejectedCount = await prisma.citizenRegistration.count({ where: { status: 'REJECTED' } });
        console.log(`\n🎉 Successfully seeded registrations!`);
        console.log(`📊 Stats:`);
        console.log(`   Total: ${totalRegistrations}`);
        console.log(`   Pending Review: ${pendingCount}`);
        console.log(`   Approved: ${approvedCount}`);
        console.log(`   Rejected: ${rejectedCount}`);
    }
    catch (error) {
        console.error('❌ Error seeding registrations:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
seedRegistrations()
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=seedRegistrations.js.map