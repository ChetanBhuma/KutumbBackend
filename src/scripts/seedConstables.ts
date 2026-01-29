import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedConstables() {
    console.log('Starting to seed dummy constables...');

    try {
        // 1. Get all active Police Stations
        const policeStations = await prisma.policeStation.findMany({
            where: { isActive: true },
        });

        if (policeStations.length === 0) {
            console.log('No police stations found. Please seed master data first.');
            return;
        }

        console.log(`Found ${policeStations.length} police stations.`);

        // 2. Constants for dummy data
        const dummyPassword = await bcrypt.hash('password123', 10);
        let createdCount = 0;

        for (const station of policeStations) {
            console.log(`Processing station: ${station.name} (${station.code})`);

            for (let i = 1; i <= 5; i++) {
                const uniqueId = `${station.code}-CONST-${i}-${Date.now()}`;
                const badgeNumber = `BADGE-${uniqueId}`;
                const mobileNumber = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
                const email = `constable.${uniqueId}@delhipolice.gov.in`.toLowerCase();

                // Create BeatOfficer linked to Station (hierarchy)
                // Note: beatId is NULL initially as requested (mapped to Station, not Beat)
                const officer = await prisma.beatOfficer.create({
                    data: {
                        name: `Constable ${station.code} ${i}`,
                        rank: 'CONSTABLE',
                        badgeNumber: badgeNumber,
                        mobileNumber: mobileNumber,
                        email: email,
                        policeStationId: station.id,
                        districtId: station.districtId,
                        subDivisionId: station.subDivisionId,
                        rangeId: station.rangeId,
                        isActive: true,
                        beatId: null, // Explicitly null as per "not mapped to beat" requirement
                        user: {
                            create: {
                                email: email,
                                phone: mobileNumber,
                                passwordHash: dummyPassword,
                                role: 'CONSTABLE',
                                isActive: true,
                            }
                        }
                    }
                });
                createdCount++;
            }
        }

        console.log(`Successfully created ${createdCount} dummy constables across ${policeStations.length} stations.`);

    } catch (error) {
        console.error('Error seeding constables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedConstables()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
