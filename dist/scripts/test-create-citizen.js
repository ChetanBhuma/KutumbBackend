"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        console.log('Starting test creation...');
        // Mock data matching the new form structure
        const mockCitizen = {
            fullName: "Test Senior Citizen",
            dateOfBirth: new Date("1950-01-01"),
            gender: "Male",
            mobileNumber: "9999999999",
            permanentAddress: "123 Test St, Delhi",
            pinCode: "110001",
            maritalStatus: "Married",
            nationality: "Indian",
            // New fields
            educationQualification: "Graduate",
            religion: "Hindu",
            yearOfRetirement: 2010,
            retiredFrom: "Government Service",
            // Nested Spouse Details
            spouseDetails: {
                create: {
                    fullName: "Test Spouse",
                    dateOfBirth: new Date("1955-01-01"),
                    gender: "Female",
                    mobileNumber: "8888888888",
                    isLivingTogether: true,
                    relationshipStatus: "Married"
                }
            },
            // Nested Family Members
            familyMembers: {
                create: [
                    {
                        name: "Test Son",
                        relation: "Son",
                        age: 40,
                        mobileNumber: "7777777777"
                    }
                ]
            },
            emergencyContacts: {
                create: [
                    {
                        name: "Emergency Contact 1",
                        relation: "Brother",
                        mobileNumber: "6666666666",
                        address: "456 Emergency St",
                        isPrimary: true
                    }
                ]
            },
        };
        // Create directly via Prisma to test schema and relations first
        // The controller does similar logic but adds calculated fields like age and ID
        // We'll simulate what the controller does:
        const dob = new Date(mockCitizen.dateOfBirth);
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const srCitizenUniqueId = `SC-TEST-${Date.now()}`;
        console.log('Creating citizen with ID:', srCitizenUniqueId);
        const citizen = await prisma.seniorCitizen.create({
            data: {
                ...mockCitizen,
                age,
                srCitizenUniqueId,
                receivedBy: "test@example.com",
                dataEntryCompletedBy: "test@example.com",
                dataEntryDate: new Date()
            },
            include: {
                SpouseDetails: true,
                FamilyMember: true,
                EmergencyContact: true
            }
        });
        console.log('Successfully created citizen:', citizen.id);
        console.log('Spouse Details:', citizen.SpouseDetails);
        if (citizen.SpouseDetails?.fullName === "Test Spouse") {
            console.log('VERIFICATION PASSED: Spouse details correctly saved.');
        }
        else {
            console.error('VERIFICATION FAILED: Spouse details mismatch.');
        }
        // Clean up
        await prisma.spouseDetails.deleteMany({ where: { seniorCitizenId: citizen.id } });
        await prisma.familyMember.deleteMany({ where: { seniorCitizenId: citizen.id } });
        await prisma.emergencyContact.deleteMany({ where: { seniorCitizenId: citizen.id } });
        await prisma.seniorCitizen.delete({ where: { id: citizen.id } });
        console.log('Cleaned up test data.');
    }
    catch (error) {
        console.error('Test failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-create-citizen.js.map