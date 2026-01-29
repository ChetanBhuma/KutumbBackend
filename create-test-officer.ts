
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Ensure Police Station exists
        let station = await prisma.policeStation.findFirst({ where: { code: 'PS001' } });
        if (!station) {
            station = await prisma.policeStation.create({
                data: {
                    name: 'Test Station',
                    code: 'PS001',
                    address: 'Test Address'
                }
            });
        }

        // Create Test Officer
        const officer = await prisma.beatOfficer.upsert({
            where: { badgeNumber: 'TEST-OFFICER' },
            update: {
                mobileNumber: '9999888877'
            },
            create: {
                name: 'Test Officer',
                rank: 'SI',
                badgeNumber: 'TEST-OFFICER',
                mobileNumber: '9999888877', // Unique
                email: 'test.officer@delhipolice.gov.in',
                policeStationId: station.id
            }
        });

        console.log('Test Officer Ready:', JSON.stringify(officer, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main().finally(async () => {
    await prisma.$disconnect();
});
