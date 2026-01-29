
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const mobile = '9999999999';
        console.log(`Checking for user with mobile: ${mobile}`);

        const citizen = await prisma.seniorCitizen.findFirst({
            where: {
                OR: [
                    { mobileNumber: mobile },
                    { mobileNumber: `+91${mobile}` },
                    { whatsappNumber: mobile } // Check the new field too just in case
                ]
            }
        });

        if (citizen) {
            console.log('✅ Citizen Found:', JSON.stringify(citizen, null, 2));

            const auth = await prisma.citizenAuth.findFirst({
                where: { mobileNumber: mobile }
            });
            console.log('🔐 Auth Record:', auth ? 'Found' : 'Not Found');

        } else {
            console.log('❌ Citizen NOT Found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
