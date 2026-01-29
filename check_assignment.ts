
import { prisma } from './src/config/database';

async function checkAssignment() {
    try {
        const mobile = '+917889785489';
        const name = 'New Saket Citizen';
        console.log(`Searching for citizen with mobile: '${mobile}' OR name: '${name}'`);

        const citizen = await prisma.seniorCitizen.findFirst({
            where: {
                OR: [
                    { mobileNumber: mobile },
                    { fullName: { contains: name, mode: 'insensitive' } }
                ]
            },
            include: {
                Beat: true,
                PoliceStation: true
            }
        });

        if (!citizen) {
            console.log('Citizen not found!');
            return;
        }

        console.log(`Citizen Found: ${citizen.fullName} (${citizen.id})`);
        console.log(`Mobile: ${citizen.mobileNumber}`);
        console.log(`Beat: ${citizen.Beat?.name}, Police Station: ${citizen.PoliceStation?.name}`);

        console.log('\n--- Checking Verification Visit ---');
        const visit = await prisma.visit.findFirst({
            where: {
                seniorCitizenId: citizen.id,
                visitType: 'Verification'
            },
            include: {
                officer: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (visit) {
            console.log(`Visit Status: ${visit.status}`);
            console.log(`Scheduled Date: ${visit.scheduledDate}`);
            if (visit.officer) {
                console.log(`Assigned Officer: ${visit.officer.name} (Badge: ${visit.officer.badgeNumber})`);
                console.log(`Officer Mobile: ${visit.officer.mobileNumber}`);
            } else {
                console.log('Officer: NOT ASSIGNED');
            }
        } else {
            console.log('No Verification Visit found for this citizen.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkAssignment();
