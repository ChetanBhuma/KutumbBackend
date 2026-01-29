
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding data for TEST-OFFICER...');

    // 1. Get Officer
    const officer = await prisma.beatOfficer.findUnique({
        where: { badgeNumber: 'TEST-OFFICER' },
        include: { PoliceStation: true }
    });

    if (!officer) {
        console.error('❌ TEST-OFFICER not found. Please run create-test-officer.ts first.');
        return;
    }

    const { id: officerId, policeStationId } = officer;

    // 2. Create Citizens in this Station
    console.log('Creating Senior Citizens...');
    const citizens = [];
    for (let i = 1; i <= 5; i++) {
        const citizen = await prisma.seniorCitizen.create({
            data: {
                fullName: `Citizen Test ${i}`,
                mobileNumber: `900000000${i}`,
                dateOfBirth: new Date('1950-01-01'),
                age: 74,
                gender: i % 2 === 0 ? 'Female' : 'Male',
                permanentAddress: `House ${i}, Test Lane, Delhi`,
                pinCode: '110001',
                policeStationId,
                vulnerabilityLevel: i === 1 ? 'High' : (i === 2 ? 'Medium' : 'Low'),
                status: 'Active',
                isActive: true
            }
        });
        citizens.push(citizen);
    }

    // 3. Create Visits for this Officer
    console.log('Creating Visits...');

    // Visit 1: Overdue (Yesterday)
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[0].id,
            officerId,
            policeStationId,
            scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
            status: 'SCHEDULED',
            visitType: 'Routine',
            priority: 'HIGH'
        }
    });

    // Visit 2: Today
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[1].id,
            officerId,
            policeStationId,
            scheduledDate: new Date(),
            status: 'SCHEDULED',
            visitType: 'Health Check',
            priority: 'NORMAL'
        }
    });

    // Visit 3: Completed
    await prisma.visit.create({
        data: {
            seniorCitizenId: citizens[2].id,
            officerId,
            policeStationId,
            scheduledDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
            completedDate: new Date(Date.now() - 47 * 60 * 60 * 1000),
            status: 'COMPLETED',
            visitType: 'Registration Verification',
            priority: 'NORMAL',
            notes: 'Citizen is doing well.'
        }
    });

    // 4. Create SOS Alert
    console.log('Creating SOS Alert...');
    await prisma.sOSAlert.create({
        data: {
            seniorCitizenId: citizens[0].id, // High vulnerability citizen
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Near India Gate',
            status: 'Active',
            batteryLevel: 25
        }
    });

    console.log('✅ Dummy data seeded successfully for TEST-OFFICER');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
