import { PrismaClient, VisitStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOfficerData() {
    console.log('🌱 Seeding officer data for DL001234...\n');

    try {
        const badgeNumber = 'DL001234';

        // 1. Find the Officer
        const officer = await prisma.beatOfficer.findUnique({
            where: { badgeNumber },
        });

        if (!officer) {
            console.error(`❌ Officer with badge ${badgeNumber} not found! Run seed-test-users.ts first.`);
            return;
        }

        console.log(`✅ Found Officer: ${officer.name} (${officer.id})`);

        const { policeStationId, beatId } = officer;

        if (!policeStationId || !beatId) {
            console.error('❌ Officer is not assigned to a Police Station or Beat properly.');
            return;
        }

        // 2. Create Dummy Citizens
        console.log('\nCreating dummy citizens...');

        const dummyCitizens = [
            {
                name: 'Suresh Kumar',
                phone: '9900000001',
                address: 'H.No 123, Block A, CP',
                gender: 'Male',
                age: 70,
                dob: new Date('1955-01-01')
            },
            {
                name: 'Anita Desai',
                phone: '9900000002',
                address: 'Flat 402, Sunshine Apts',
                gender: 'Female',
                age: 68,
                dob: new Date('1957-05-15')
            },
            {
                name: 'Om Prakash',
                phone: '9900000003',
                address: 'Shop 12, Inner Circle',
                gender: 'Male',
                age: 75,
                dob: new Date('1950-08-20')
            }
        ];

        const createdCitizens = [];

        for (const c of dummyCitizens) {
            // Check if user exists to avoid unique constraint
            let user = await prisma.user.findUnique({ where: { phone: c.phone } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        phone: c.phone,
                        email: `dummy.${c.phone}@test.com`,
                        passwordHash: 'dummy', // Not for login
                        role: 'CITIZEN',
                        isActive: true
                    }
                });
            }

            const citizen = await prisma.seniorCitizen.upsert({
                where: { mobileNumber: c.phone },
                update: {},
                create: {
                    userId: user.id,
                    fullName: c.name,
                    mobileNumber: c.phone,
                    gender: c.gender,
                    age: c.age,
                    dateOfBirth: c.dob,
                    permanentAddress: c.address,
                    pinCode: '110001',
                    status: 'VERIFIED',
                    idVerificationStatus: 'Verified',
                    policeStationId,
                    beatId,
                    districtId: (await prisma.district.findFirst())?.id || 'default-district-id' // Fallback
                }
            });
            createdCitizens.push(citizen);
            console.log(`   + Created/Found Citizen: ${citizen.fullName}`);
        }

        // 3. Create Visits
        console.log('\nCreating visits...');

        const visits = [
            {
                citizenIdx: 0,
                type: 'Routine',
                status: VisitStatus.SCHEDULED,
                date: new Date(Date.now() + 86400000), // Tomorrow
                notes: 'Regular checkup scheduled.'
            },
            {
                citizenIdx: 0,
                type: 'Routine',
                status: VisitStatus.COMPLETED,
                date: new Date(Date.now() - 86400000 * 2), // 2 days ago
                completedDate: new Date(Date.now() - 86400000 * 2 + 3600000),
                notes: 'All good. Medicine stock checked.'
            },
            {
                citizenIdx: 1,
                type: 'Emergency',
                status: VisitStatus.IN_PROGRESS,
                date: new Date(), // Now
                notes: 'Reported chest pain. Ambulance called.'
            },
            {
                citizenIdx: 1,
                type: 'Routine',
                status: VisitStatus.MISSED,
                date: new Date(Date.now() - 86400000 * 5), // 5 days ago
                notes: 'Citizen was not at home.'
            },
            {
                citizenIdx: 2,
                type: 'FollowUp',
                status: VisitStatus.CANCELLED,
                date: new Date(Date.now() + 86400000 * 2), // Day after tomorrow
                notes: 'Citizen requested reschedule.'
            }
        ];

        for (const v of visits) {
            const citizen = createdCitizens[v.citizenIdx];
            await prisma.visit.create({
                data: {
                    seniorCitizenId: citizen.id,
                    officerId: officer.id,
                    policeStationId,
                    beatId,
                    visitType: v.type,
                    status: v.status,
                    scheduledDate: v.date,
                    completedDate: v.completedDate,
                    notes: v.notes,
                    createdAt: new Date()
                }
            });
            console.log(`   + Created Visit: ${v.type} - ${v.status} for ${citizen.fullName}`);
        }

        console.log('\n🎉 Officer data seeded successfully!');

    } catch (error) {
        console.error('❌ Error seeding officer data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedOfficerData();
