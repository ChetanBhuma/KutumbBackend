
import { prisma } from './src/config/database';

async function findLocationIds() {
    try {
        console.log('Finding IDs for South District, Saket PS, and Saket Beat 1...');

        const district = await prisma.district.findFirst({
            where: { name: { contains: 'South', mode: 'insensitive' } }
        });
        console.log('District:', district ? `${district.name} (${district.id})` : 'Not Found');

        const ps = await prisma.policeStation.findFirst({
            where: {
                name: { contains: 'Saket', mode: 'insensitive' },
                // districtId: district?.id // Optional: enforce hierarchy if strictly needed
            }
        });
        console.log('Police Station:', ps ? `${ps.name} (${ps.id})` : 'Not Found');

        if (ps) {
            const beat = await prisma.beat.findFirst({
                where: {
                    policeStationId: ps.id,
                    name: { contains: 'Beat 1', mode: 'insensitive' }
                }
            });
            console.log('Beat:', beat ? `${beat.name} (${beat.id})` : 'Not Found');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
findLocationIds();
