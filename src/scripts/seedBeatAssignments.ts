import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBeatAssignments() {
    console.log('Starting automated beat assignment (2 constables per beat)...');

    try {
        const policeStations = await prisma.policeStation.findMany({
            where: { isActive: true },
            include: {
                Beat: {
                    where: { isActive: true }
                }
            }
        });

        let totalAssigned = 0;

        for (const station of policeStations) {
            const beats = station.Beat;
            if (beats.length === 0) continue;

            // Get unassigned constables for this station
            const constables = await prisma.beatOfficer.findMany({
                where: {
                    policeStationId: station.id,
                    rank: 'CONSTABLE',
                    beatId: null,
                    isActive: true
                }
            });

            if (constables.length === 0) continue;

            let constableIndex = 0;

            for (const beat of beats) {
                // Determine how many to assign: target 2, but limited by available constables
                const assignCount = 2;

                for (let i = 0; i < assignCount; i++) {
                    if (constableIndex < constables.length) {
                        const officer = constables[constableIndex];

                        await prisma.beatOfficer.update({
                            where: { id: officer.id },
                            data: { beatId: beat.id }
                        });

                        totalAssigned++;
                        constableIndex++;
                    }
                }
            }
            // Remaining constables stay unassigned
        }

        console.log(`Assignment complete.`);
        console.log(`Total officers assigned: ${totalAssigned}`);

    } catch (error) {
        console.error('Error in beat assignment:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedBeatAssignments();
