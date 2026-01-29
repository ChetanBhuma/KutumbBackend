
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMobile() {
    const mobile = '+919000000001';

    console.log(`Checking for mobile: ${mobile}`);

    const registration = await prisma.citizenRegistration.findFirst({
        where: { mobileNumber: mobile } // Using findFirst as I'm not sure if it's unique in schema or just effectively unique
    });

    const citizen = await prisma.seniorCitizen.findFirst({
        where: { mobileNumber: mobile }
    });

    const auth = await prisma.citizenAuth.findFirst({
        where: { mobileNumber: mobile }
    });

    console.log('--- CitizenRegistration ---');
    console.dir(registration, { depth: null });

    console.log('\n--- SeniorCitizen ---');
    console.dir(citizen, { depth: null });

    console.log('\n--- CitizenAuth ---');
    console.dir(auth, { depth: null });
}

checkMobile()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
