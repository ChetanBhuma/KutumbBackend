import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOfficer() {
    try {
        // Find District and Police Station
        const district = await prisma.district.findFirst({
            where: { name: { contains: 'Dwarka', mode: 'insensitive' } }
        });

        if (!district) {
            console.error('❌ District Dwarka not found!');
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
            return;
        }

        // Find or create a beat for this police station
        let beat = await prisma.beat.findFirst({
            where: { policeStationId: policeStation.id }
        });

        if (!beat) {
            beat = await prisma.beat.create({
                data: {
                    name: 'Beat 1 - Uttam Nagar',
                    policeStationId: policeStation.id,
                    districtId: district.id
                }
            });
            console.log('✅ Created Beat:', beat.name);
        }

        // Generate PIS Number (using district code + random)
        const pisNumber = '28' + Math.floor(100000 + Math.random() * 900000);

        // Check if officer with this PIS already exists
        const existing = await prisma.beatOfficer.findUnique({
            where: { badgeNumber: pisNumber }
        });

        if (existing) {
            console.log('⚠️  Officer already exists with PIS:', pisNumber);
            console.log('Officer Details:', existing);
            return;
        }

        // Create the beat officer
        const hashedPassword = await bcrypt.hash('officer123', 10);

        const officer = await prisma.beatOfficer.create({
            data: {
                name: 'Officer Rajesh Kumar',
                badgeNumber: pisNumber,
                rank: 'Constable',
                mobileNumber: '9876543210',
                email: `officer.${pisNumber}@delhipolice.gov.in`,
                password: hashedPassword,
                isActive: true,
                beatId: beat.id,
                policeStationId: policeStation.id,
                districtId: district.id
            }
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
        console.log('   Beat:', beat.name);
        console.log('   Password: officer123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('Error creating officer:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createOfficer();
