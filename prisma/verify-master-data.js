
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyData() {
    try {
        console.log('🔍 Verifying Master Data fields...');

        const citizen = await prisma.seniorCitizen.findFirst({
            include: {
                MedicalHistory: true,
                FamilyMember: true
            }
        });

        if (citizen) {
            console.log('✅ Citizen Found:', citizen.fullName);
            console.log('   - WhatsApp:', citizen.whatsappNumber);
            console.log('   - Religion:', citizen.religion);
            console.log('   - Blood Group:', citizen.bloodGroup);
            console.log('   - Medical History Count:', citizen.MedicalHistory.length);
            if (citizen.MedicalHistory.length > 0) {
                console.log('   - First Condition:', citizen.MedicalHistory[0]);
            }
            console.log('   - Family Members:', citizen.FamilyMember.length);
            console.log('   - Nearby Family:', citizen.nearbyFamilyDetails);
        } else {
            console.log('❌ No citizens found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyData();
