import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Weaving the Officer Reality...');

    // 0. Ensure a District exists
    let district = await prisma.district.findFirst({ where: { name: 'South West' } });
    if (!district) {
        district = await prisma.district.create({
            data: {
                name: 'South West',
                code: 'DIST-SW',
                range: 'South Range',
                area: 'South West Delhi',
                headquarters: 'Vasant Vihar',
                isActive: true
            }
        });
    }

    // 1. Create/Find a standard Police Station and Beat
    let station = await prisma.policeStation.findFirst({ where: { name: 'Vasant Vihar' } });
    if (!station) {
        station = await prisma.policeStation.create({
            data: {
                name: 'Vasant Vihar',
                code: 'PS-VV',
                address: 'Vasant Vihar, New Delhi',
                phone: '011-26140001',
                latitude: 28.5603,
                longitude: 77.1601,
                District: {
                    connect: { id: district.id }
                }
            }
        });
    }

    let beat = await prisma.beat.findFirst({ where: { name: 'Beat 1 - Munirka' } });
    if (!beat) {
        beat = await prisma.beat.create({
            data: {
                name: 'Beat 1 - Munirka',
                code: 'B-01',
                policeStationId: station.id,
                description: 'High density residential area'
            }
        });
    }

    // 2. Create the Hero Officer: Vikram Singh
    const badgeNumber = 'DELHI-002'; // New Identity
    const mobileNumber = '9876543211';
    let officer = await prisma.beatOfficer.findUnique({ where: { badgeNumber } });

    if (!officer) {
        // Check conflict on mobile
        const mobileConflict = await prisma.beatOfficer.findUnique({ where: { mobileNumber } });
        if (mobileConflict) {
            // If conflict exists, use that officer or update badge?
            // Let's assume we want to enforce badge.
            // We can rename the conflicting officer's mobile?
            // Or better, just use the found officer.
            officer = mobileConflict;
            console.log(`👮 Found Officer by Mobile: ${officer.name}`);
            // Ensure badge matches if we can?
            if (officer.badgeNumber !== badgeNumber) {
                // Try to update badge
                try {
                    officer = await prisma.beatOfficer.update({
                        where: { id: officer.id },
                        data: { badgeNumber }
                    });
                } catch (err) {
                    console.log('Could not update badge (duplicate?), using existing badge.');
                }
            }
        } else {
            officer = await prisma.beatOfficer.create({
                data: {
                    name: 'Vikram Singh',
                    rank: 'Sub-Inspector',
                    badgeNumber,
                    mobileNumber,
                    email: 'vikram.s@delhipolice.gov.in',
                    policeStationId: station.id,
                    beatId: beat.id
                }
            });
            console.log(`👮 Created Officer: ${officer.name} (${officer.badgeNumber})`);
        }
    } else {
        // Ensure he is assigned to this beat for the demo
        officer = await prisma.beatOfficer.update({
            where: { id: officer.id },
            data: { beatId: beat.id, policeStationId: station.id }
        });
        console.log(`👮 Found Officer: ${officer.name}`);
    }

    // Ensure User account exists
    const userEmail = officer.email!;
    const userPhone = officer.mobileNumber;

    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: userEmail },
                { phone: userPhone },
                { officerId: officer.id }
            ]
        }
    });

    if (user) {
        // Link existing user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                officerId: officer.id,
                role: 'OFFICER',
                email: userEmail, // ensure sync
                phone: userPhone
            }
        });
        console.log(`👤 Updated User Account: ${user.email}`);
    } else {
        // Create new
        try {
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    phone: userPhone,
                    passwordHash: 'dummy_hash',
                    role: 'OFFICER',
                    officerId: officer.id
                }
            });
            console.log(`👤 Created User Account: ${user.email}`);
        } catch (e) {
            console.error("Failed to creat user:", e);
        }
    }

    // 3. Create Senior Citizens (The Cast)
    const citizensData = [
        {
            name: 'Amitabh Sharma',
            age: 78,
            mobile: '9800000001',
            details: { vulnerabilityLevel: 'Critical', address: 'Block A, H-12, Munirka', lat: 28.5580, lng: 77.1700 }
        },
        {
            name: 'Savita Devi',
            age: 82,
            mobile: '9800000002',
            details: { vulnerabilityLevel: 'High', address: 'Block C, Plot 45, Munirka Enclave', lat: 28.5590, lng: 77.1710 }
        },
        {
            name: 'Dr. R.K. Gupta',
            age: 70,
            mobile: '9800000003',
            details: { vulnerabilityLevel: 'Moderate', address: 'DDA Flats, Munirka', lat: 28.5600, lng: 77.1720 }
        }
    ];

    const citizens = [];
    for (const c of citizensData) {
        let sc = await prisma.seniorCitizen.findFirst({ where: { mobileNumber: c.mobile } });
        if (!sc) {
            sc = await prisma.seniorCitizen.create({
                data: {
                    fullName: c.name,
                    dateOfBirth: new Date(new Date().getFullYear() - c.age, 0, 1),
                    age: c.age,
                    gender: 'Male',
                    mobileNumber: c.mobile,
                    permanentAddress: c.details.address,
                    vulnerabilityLevel: c.details.vulnerabilityLevel,
                    gpsLatitude: c.details.lat,
                    gpsLongitude: c.details.lng,
                    policeStationId: station.id,
                    beatId: beat.id,
                    pinCode: '110067',
                }
            });
        }
        citizens.push(sc);
    }
    console.log(`👴 Verified ${citizens.length} Citizens`);

    // 4. Create Visits
    // Clear existing visits for this officer to have a clean slate (optional, but good for demo)
    await prisma.visit.deleteMany({ where: { officerId: officer.id } });

    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    // Visit 1: Completed Yesterday
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[1].id,
            officerId: officer.id,
            policeStationId: station.id,
            scheduledDate: yesterday,
            status: 'COMPLETED',
            completedDate: new Date(yesterday.getTime() + 1000 * 60 * 45),
            visitType: 'Routine',
            notes: 'Health is stable.',
            gpsLatitude: citizens[1].gpsLatitude,
            gpsLongitude: citizens[1].gpsLongitude,
            duration: 45
        }
    });

    // Visit 2: Overdue
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[0].id,
            officerId: officer.id,
            policeStationId: station.id,
            scheduledDate: lastWeek,
            status: 'SCHEDULED',
            visitType: 'Routine',
            notes: 'Requires urgent checkup.'
        }
    });

    // Visit 3: Scheduled Today
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[2].id,
            officerId: officer.id,
            policeStationId: station.id,
            scheduledDate: new Date(today.setHours(10, 0, 0, 0)),
            status: 'SCHEDULED',
            visitType: 'Routine',
            notes: 'Routine check.'
        }
    });

    // Visit 4: Emergency Today
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[0].id,
            officerId: officer.id,
            policeStationId: station.id,
            scheduledDate: new Date(today.setHours(14, 0, 0, 0)),
            status: 'SCHEDULED',
            visitType: 'Emergency',
            notes: 'SOS Alert triggered.'
        }
    });

    // Visit 5: Scheduled Tomorrow
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[1].id,
            officerId: officer.id,
            policeStationId: station.id,
            scheduledDate: tomorrow,
            status: 'SCHEDULED',
            visitType: 'Follow-up'
        }
    });

    console.log('✅ Scenario Generated!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
