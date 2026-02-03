import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('🔍 Checking Neon Database...\n');

        // Check Users
        const userCount = await prisma.user.count();
        console.log(`✅ Users: ${userCount} records`);

        if (userCount > 0) {
            const superadmin = await prisma.user.findFirst({
                where: { email: 'superadmin@delhipolice.gov.in' }
            });
            console.log(`   ${superadmin ? '✅' : '❌'} Superadmin user exists`);
        }

        // Check Roles
        const roleCount = await prisma.role.count();
        console.log(`✅ Roles: ${roleCount} records`);

        // Check Police Stations
        const stationCount = await prisma.policeStation.count();
        console.log(`✅ Police Stations: ${stationCount} records`);

        // Check Beats
        const beatCount = await prisma.beat.count();
        console.log(`✅ Beats: ${beatCount} records`);

        // Check Citizens
        const citizenCount = await prisma.citizen.count();
        console.log(`✅ Citizens: ${citizenCount} records`);

        console.log('\n✅ Database check complete!');
    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
