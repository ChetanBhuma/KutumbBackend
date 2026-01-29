const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateOfficerMobile() {
    try {
        const pisNumber = '28130379';

        // Find the officer
        const officer = await prisma.beatOfficer.findUnique({
            where: { badgeNumber: pisNumber }
        });

        if (!officer) {
            console.error('❌ Officer with PIS', pisNumber, 'not found!');
            return;
        }

        // Generate a unique mobile number
        const newMobile = '98' + Math.floor(10000000 + Math.random() * 90000000).toString();

        // Check if this mobile is already used
        const existingUser = await prisma.user.findUnique({
            where: { phone: newMobile }
        });

        if (existingUser) {
            console.error('❌ Mobile number collision, run script again');
            return;
        }

        // Update the officer's mobile number
        const updated = await prisma.beatOfficer.update({
            where: { badgeNumber: pisNumber },
            data: { mobileNumber: newMobile }
        });

        console.log('\n✅ Officer Mobile Number Updated!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Updated Officer Details:');
        console.log('   Name:', updated.name);
        console.log('   PIS Number:', updated.badgeNumber);
        console.log('   Old Mobile: 9876543210');
        console.log('   New Mobile:', updated.mobileNumber);
        console.log('   Email:', updated.email);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ You can now login with PIS:', pisNumber);
        console.log('   OTP will be sent to:', updated.mobileNumber);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error updating officer:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

updateOfficerMobile();
