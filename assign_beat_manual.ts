
import { prisma } from './src/config/database';

async function assignBeat() {
    try {
        const mobile = '+917889785489';

        // Find a valid beat (e.g., Beat 1 in Saket PS)
        // We know Saket PS exists from previous output.
        const beat = await prisma.beat.findFirst({
            where: { PoliceStation: { name: { contains: 'Saket' } } }
        });

        if (!beat) {
            console.log('No beat found for Saket PS.');
            return;
        }

        console.log(`Assigning Beat: ${beat.name} to citizen...`);

        await prisma.seniorCitizen.update({
            where: { mobileNumber: mobile },
            data: {
                beatId: beat.id,
                policeStationId: beat.policeStationId,
                districtId: (await prisma.policeStation.findUnique({where: {id: beat.policeStationId}}))?.districtId
            }
        });

        console.log('Beat assigned. Now run fix_assignment.ts');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
assignBeat();
