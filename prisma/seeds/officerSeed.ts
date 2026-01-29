import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOfficers() {
    console.log('👮 Seeding Beat Officers...');

    // 1. Find User
    const officerUser = await prisma.user.findUnique({
        where: { email: 'officer-range@delhipolice.gov.in' }
    });

    if (!officerUser) {
        console.error('Officer User not found. Run userSeed first.');
        return;
    }

    // 2. Find Police Station
    const station = await prisma.policeStation.findFirst({
        where: { code: 'PS001' } as any
    });

    if (!station) {
        console.error('Police Station PS001 not found. Run masterDataSeed first.');
        return;
    }

    // 3. Create or Link Beat Officer
    // Check if exists by mobile first
    let beatOfficer = await prisma.beatOfficer.findUnique({
        where: { mobileNumber: officerUser.phone } as any
    });

    if (!beatOfficer) {
        beatOfficer = await prisma.beatOfficer.upsert({
            where: { badgeNumber: 'SI-12345' } as any,
            update: {},
            create: {
                name: 'Officer Range',
                rank: 'Sub-Inspector',
                badgeNumber: 'SI-12345',
                mobileNumber: officerUser.phone,
                email: officerUser.email,
                policeStationId: station.id,
                isActive: true
            } as any
        });
    }

    // 4. Link User to Beat Officer (Relation is on User side: officerId)
    await prisma.user.update({
        where: { id: officerUser.id },
        data: {
            officerId: beatOfficer.id
        }
    });

    console.log('✅ Beat Officer seeded and linked to User.');
}

seedOfficers()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
