"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedCompleteWorkflow() {
    console.log('🌱 Starting comprehensive workflow seed...\n');
    try {
        // Get existing citizens with their details
        const citizens = await prisma.seniorCitizen.findMany({
            take: 30,
            include: {
                PoliceStation: true,
                Beat: true,
                District: true,
                EmergencyContact: true,
            }
        });
        if (citizens.length === 0) {
            console.log('⚠️  No citizens found. Please run seedCitizensWithCoordinates.ts first.');
            return;
        }
        console.log(`📋 Found ${citizens.length} citizens to process\n`);
        // Clear existing registrations to start fresh
        await prisma.citizenRegistration.deleteMany({});
        console.log('🗑️  Cleared existing registrations\n');
        let stats = {
            inProgress: 0,
            pendingReview: 0,
            approved: 0,
            rejected: 0,
            cardIssued: 0,
        };
        // Create registrations with logical workflow progression
        for (let i = 0; i < citizens.length; i++) {
            const citizen = citizens[i];
            // Determine workflow stage based on index for variety
            let status;
            let citizenId;
            let registrationStep;
            let updateCitizenStatus = false;
            let issueCard = false;
            if (i < 5) {
                // First 5: In Progress (not yet submitted)
                status = 'IN_PROGRESS';
                citizenId = undefined;
                registrationStep = 'PERSONAL_DETAILS';
                stats.inProgress++;
            }
            else if (i < 15) {
                // Next 10: Pending Review (submitted, awaiting approval)
                status = 'PENDING_REVIEW';
                citizenId = citizen.id;
                registrationStep = 'COMPLETED';
                updateCitizenStatus = true;
                stats.pendingReview++;
            }
            else if (i < 23) {
                // Next 8: Approved (but card not issued yet)
                status = 'APPROVED';
                citizenId = citizen.id;
                registrationStep = 'COMPLETED';
                updateCitizenStatus = true;
                stats.approved++;
            }
            else if (i < 27) {
                // Next 4: Approved with card issued
                status = 'APPROVED';
                citizenId = citizen.id;
                registrationStep = 'COMPLETED';
                updateCitizenStatus = true;
                issueCard = true;
                stats.cardIssued++;
            }
            else {
                // Last 3: Rejected
                status = 'REJECTED';
                citizenId = citizen.id;
                registrationStep = 'COMPLETED';
                updateCitizenStatus = true;
                stats.rejected++;
            }
            // Create registration
            await prisma.citizenRegistration.create({
                data: {
                    mobileNumber: citizen.mobileNumber,
                    fullName: citizen.fullName,
                    otpVerified: status !== 'IN_PROGRESS',
                    status: status,
                    registrationStep: registrationStep,
                    citizenId: citizenId,
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
                        districtId: citizen.districtId,
                        bloodGroup: citizen.bloodGroup,
                        maritalStatus: citizen.maritalStatus,
                        livingArrangement: citizen.livingArrangement,
                    }
                }
            });
            // Update citizen verification status based on registration status
            if (updateCitizenStatus && citizenId) {
                let verificationStatus;
                if (status === 'APPROVED') {
                    verificationStatus = 'Verified';
                }
                else if (status === 'REJECTED') {
                    verificationStatus = 'Rejected';
                }
                else {
                    verificationStatus = 'Pending';
                }
                await prisma.seniorCitizen.update({
                    where: { id: citizenId },
                    data: {
                        idVerificationStatus: verificationStatus,
                    }
                });
            }
            // Issue digital card for approved citizens
            if (issueCard && citizenId) {
                const cardNumber = `SCID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                await prisma.seniorCitizen.update({
                    where: { id: citizenId },
                    data: {
                        digitalCardIssued: true,
                        digitalCardNumber: cardNumber,
                        digitalCardIssueDate: new Date(),
                        idVerificationStatus: 'Verified',
                    }
                });
            }
            const statusEmoji = status === 'IN_PROGRESS' ? '🔵' :
                status === 'PENDING_REVIEW' ? '🟡' :
                    status === 'APPROVED' ? '🟢' :
                        '🔴';
            console.log(`${statusEmoji} ${citizen.fullName} - ${status}${issueCard ? ' (Card Issued)' : ''}`);
        }
        console.log('\n📊 Workflow Statistics:');
        console.log('═══════════════════════════════════════');
        console.log(`🔵 In Progress:      ${stats.inProgress}`);
        console.log(`🟡 Pending Review:   ${stats.pendingReview}`);
        console.log(`🟢 Approved:         ${stats.approved}`);
        console.log(`💳 Card Issued:      ${stats.cardIssued}`);
        console.log(`🔴 Rejected:         ${stats.rejected}`);
        console.log('═══════════════════════════════════════');
        console.log(`📝 Total:            ${citizens.length}`);
        console.log('\n✅ Workflow seed completed successfully!');
        console.log('\n📌 Workflow Stages:');
        console.log('   1. IN_PROGRESS → User filling form');
        console.log('   2. PENDING_REVIEW → Submitted, awaiting admin approval');
        console.log('   3. APPROVED → Approved, ready for card issuance');
        console.log('   4. APPROVED + Card Issued → Complete workflow');
        console.log('   5. REJECTED → Application rejected');
    }
    catch (error) {
        console.error('❌ Error seeding workflow:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
seedCompleteWorkflow()
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=seedCompleteWorkflow.js.map