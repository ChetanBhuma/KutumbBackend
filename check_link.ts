
import { prisma } from './src/config/database';

async function checkLink() {
    try {
        const officer = await prisma.beatOfficer.findFirst({
            where: { name: 'Constable Priya Sharma' },
            include: { user: true }
        });

        console.log('Officer:', officer?.name);
        console.log('Mobile:', officer?.mobileNumber);
        console.log('Linked User:', officer?.user);

        console.log('\n--- Checking User by Email ---');
        const userByEmail = await prisma.user.findFirst({
            where: { email: 'priya.sharma@delhipolice.gov.in' }
        });
        console.log('User Found by Email:', userByEmail?.id, userByEmail?.email, userByEmail?.phone);

        console.log('\n--- Checking User by Phone ---');
        if (officer?.mobileNumber) {
            const userByPhone = await prisma.user.findFirst({
                where: { phone: officer.mobileNumber }
            });
            console.log('User Found by Phone:', userByPhone?.id, userByPhone?.email, userByPhone?.phone);

            if (userByPhone && officer) {
                console.log('Attempting to force link...');
                await prisma.user.update({
                    where: { id: userByPhone.id },
                    data: { officerId: officer.id }
                });
                console.log('Force link complete.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkLink();
