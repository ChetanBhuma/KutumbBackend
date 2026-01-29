const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOfficer() {
    try {
        // Find District and Police Station
        const district = await prisma.district.findFirst({
            where: { name: { contains: 'Dwarka', mode: 'insensitive' } }
        });

        if (!district) {
            console.error('❌ District Dwarka not found!');
            console.log('Available districts:');
            const districts = await prisma.district.findMany();
            districts.forEach(d => console.log('  -', d.name));
            return;
        }

        const policeStation = await prisma.policeStation.findFirst({
            where: {
                name: { contains: 'Uttam Nagar', mode: 'insensitive' },
                districtId: district.id
            }
        });

        if (!policeStation) {
            console.error('❌ Police Station Uttam Nagar not found in Dwarka district!');
            console.log('Available police stations in', district.name + ':');
            const stations = await prisma.policeStation.findMany({
                where: { districtId: district.id }
            });
            stations.forEach(s => console.log('  -', s.name));
            return;
        }

        // Find an existing beat for this police station
        const beat = await prisma.beat.findFirst({
            where: { policeStationId: policeStation.id }
        });

        // Generate PIS Number (using 28 prefix for Delhi + random 6 digits)
        let pisNumber = '28' + Math.floor(100000 + Math.random() * 900000).toString();

        // Check if officer with this PIS already exists
        let existing = await prisma.beatOfficer.findUnique({
            where: { badgeNumber: pisNumber }
        });

        // Generate new PIS if collision
        while (existing) {
            pisNumber = '28' + Math.floor(100000 + Math.random() * 900000).toString();
            existing = await prisma.beatOfficer.findUnique({
                where: { badgeNumber: pisNumber }
            });
        }

        // Create the beat officer (BeatOfficer table only requires minimal fields)
        const officerData = {
            name: 'Officer Rajesh Kumar',
            badgeNumber: pisNumber,
            rank: 'Constable',
            mobileNumber: '9876543210', // Unique number
            email: `officer.${pisNumber}@delhipolice.gov.in`,
            isActive: true,
            policeStationId: policeStation.id,
        };

        // Only add beatId if beat exists
        if (beat) {
            officerData.beatId = beat.id;
        }

        const officer = await prisma.beatOfficer.create({
            data: officerData
        });

        console.log('\n✅ Beat Officer Created Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Officer Details:');
        console.log('   Name:', officer.name);
        console.log('   PIS Number:', officer.badgeNumber);
        console.log('   Rank:', officer.rank);
        console.log('   Mobile:', officer.mobileNumber);
        console.log('   Email:', officer.email);
        console.log('   District:', district.name);
        console.log('   Police Station:', policeStation.name);
        console.log('   Beat:', beat ? beat.name : 'Not assigned');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 Note: To use this officer for login, you need to');
        console.log('   create a User record linked to this BeatOfficer.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error creating officer:', error.message);
        if (error.code === 'P2002') {
            console.error('   Unique constraint failed - mobile number or PIS already exists');
        }
    } finally {
        await prisma.$disconnect();
    }
}

createOfficer();
