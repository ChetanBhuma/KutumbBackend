
import { prisma } from './src/config/database';

async function checkRegistration() {
    try {
        const mobile = '917889785489';
        console.log(`Searching Registration for mobile: ${mobile}`);

        const reg = await prisma.citizenRegistration.findFirst({
            where: { mobileNumber: mobile },
            include: {
                visitRequests: true,
                citizen: true
            }
        });

        if (reg) {
            console.log(`Registration Found: ${reg.id}`);
            console.log(`Status: ${reg.status}`);
            console.log(`Full Name: ${reg.fullName}`);
            console.log(`Linked Citizen ID: ${reg.citizenId}`);

            if (reg.citizenId) {
                 // Check visits for this citizen ID
                 const visits = await prisma.visit.findMany({
                    where: { seniorCitizenId: reg.citizenId },
                    include: { officer: true }
                 });
                 console.log('Visits linked to this citizen:', visits.map(v => `${v.visitType}: ${v.officer.name} (${v.status})`));
            } else {
                 console.log('No final SeniorCitizen record created yet.');
            }

        } else {
            console.log('No Registration found either. Checking partial matches...');
            const partials = await prisma.citizenRegistration.findMany({
                where: { mobileNumber: { contains: '917889' } }
            });
            console.log('Potential matches:', partials.map(p => `${p.mobileNumber} - ${p.fullName}`));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkRegistration();
