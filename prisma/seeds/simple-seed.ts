import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting simple database seed...\n');

    // Get existing master data
    const districts = await prisma.district.findMany({ take: 3 });
    const policeStations = await prisma.policeStation.findMany({ take: 3 });

    if (districts.length === 0 || policeStations.length === 0) {
        console.log('Master data not found. Please run masterDataSeed.ts first');
        process.exit(1);
    }

    console.log(`Found ${districts.length} districts and ${policeStations.length} police stations\n`);

    // Create Beats
    console.log('Creating Beats...');
    const beats = [];
    for (let i = 0; i < Math.min(3, policeStations.length); i++) {
        const beat = await prisma.beat.upsert({
            where: { code: `BEAT-${i + 1}` },
            update: {},
            create: {
                name: `Beat ${i + 1}`,
                code: `BEAT-${i + 1}`,
                policeStationId: policeStations[i].id,
                boundaries: `Area ${i + 1}`
            }
        });
        beats.push(beat);
    }
    console.log(`Created ${beats.length} beats\n`);

    // Create Beat Officers
    console.log('Creating Beat Officers...');
    const officers = [];
    for (let i = 0; i < beats.length; i++) {
        const officer = await prisma.beatOfficer.upsert({
            where: { mobileNumber: `987654321${i}` },
            update: {},
            create: {
                name: `Officer ${i + 1}`,
                badgeNumber: `BADGE-${i + 1}`,
                rank: 'Constable',
                mobileNumber: `987654321${i}`,
                email: `officer${i + 1}@delhipolice.gov.in`,
                policeStationId: policeStations[i].id,
                beatId: beats[i].id
            }
        });
        officers.push(officer);
    }
    console.log(`Created ${officers.length} beat officers\n`);

    // Create Senior Citizens
    console.log('Creating Senior Citizens...');
    const calculateAge = (dob: Date) => {
        const diff = Date.now() - dob.getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };

    const citizenData = [
        { name: 'Mr. Ram Prasad', gender: 'Male', dob: new Date('1950-03-15'), mobile: '9876543230', address: 'A-12, Saket, New Delhi', pinCode: '110017', status: 'Approved' },
        { name: 'Mrs. Kamla Devi', gender: 'Female', dob: new Date('1952-07-22'), mobile: '9876543231', address: 'B-21, Greater Kailash, New Delhi', pinCode: '110048', status: 'Approved' },
        { name: 'Mr. Suresh Kumar', gender: 'Male', dob: new Date('1948-11-05'), mobile: '9876543232', address: 'H-88, Connaught Place, New Delhi', pinCode: '110001', status: 'Approved' },
        { name: 'Mrs. Sunita Sharma', gender: 'Female', dob: new Date('1955-01-19'), mobile: '9876543233', address: 'C-44, Rajouri Garden, New Delhi', pinCode: '110027', status: 'Approved' },
        { name: 'Mr. Harish Gupta', gender: 'Male', dob: new Date('1949-12-30'), mobile: '9876543234', address: '56, Dwarka Sector 12, New Delhi', pinCode: '110078', status: 'Pending' },
        { name: 'Mrs. Meera Joshi', gender: 'Female', dob: new Date('1958-07-26'), mobile: '9876543235', address: 'Green Apartment, Saket, New Delhi', pinCode: '110017', status: 'Pending' },
        { name: 'Mr. Baldev Singh', gender: 'Male', dob: new Date('1947-09-18'), mobile: '9876543236', address: 'Punjabi Bagh, New Delhi', pinCode: '110026', status: 'Approved' },
        { name: 'Mrs. Veena Nair', gender: 'Female', dob: new Date('1953-02-09'), mobile: '9876543237', address: 'Lajpat Nagar, New Delhi', pinCode: '110024', status: 'Rejected' },
        { name: 'Mr. Ashok Verma', gender: 'Male', dob: new Date('1951-06-14'), mobile: '9876543238', address: 'Vasant Vihar, New Delhi', pinCode: '110057', status: 'Approved' },
        { name: 'Mrs. Lakshmi Iyer', gender: 'Female', dob: new Date('1954-10-08'), mobile: '9876543239', address: 'Karol Bagh, New Delhi', pinCode: '110005', status: 'Approved' },
    ];

    const citizens = [];
    for (let i = 0; i < citizenData.length; i++) {
        const data = citizenData[i];
        const districtIndex = i % districts.length;
        const policeStationIndex = i % policeStations.length;
        const beatIndex = i % beats.length;

        const citizen = await prisma.seniorCitizen.upsert({
            where: { mobileNumber: data.mobile },
            update: {},
            create: {
                fullName: data.name,
                dateOfBirth: data.dob,
                age: calculateAge(data.dob),
                gender: data.gender,
                mobileNumber: data.mobile,
                permanentAddress: data.address,
                presentAddress: data.address,
                pinCode: data.pinCode,
                districtId: districts[districtIndex].id,
                policeStationId: policeStations[policeStationIndex].id,
                beatId: beats[beatIndex].id,
                vulnerabilityLevel: i % 3 === 0 ? 'High' : i % 2 === 0 ? 'Medium' : 'Low',
                idVerificationStatus: data.status,
                maritalStatus: 'Married',
                nationality: 'Indian',
                languagesKnown: ['Hindi', 'English'],
                consentDataUse: true,
                consentToNotifyFamily: true,
                consentShareHealth: true,
                consentNotifications: true,
                consentServiceRequest: true,
                registeredOnApp: true,
                isActive: true,
                gpsLatitude: 28.6139 + (Math.random() - 0.5) * 0.1,
                gpsLongitude: 77.2090 + (Math.random() - 0.5) * 0.1,
            }
        });
        citizens.push(citizen);

        // Create emergency contact
        await prisma.emergencyContact.upsert({
            where: { id: `ec-${citizen.id}` },
            update: {},
            create: {
                id: `ec-${citizen.id}`,
                seniorCitizenId: citizen.id,
                name: 'Family Member',
                relation: 'Son/Daughter',
                mobileNumber: `98765432${40 + i}`,
                address: data.address,
                isPrimary: true
            }
        });
    }
    console.log(`Created ${citizens.length} senior citizens\n`);

    // Create Visits
    console.log('Creating Visits...');
    let visitCount = 0;
    for (let i = 0; i < citizens.length; i++) {
        const citizen = citizens[i];
        const officer = officers[i % officers.length];

        // Past visit
        await prisma.visit.create({
            data: {
                seniorCitizenId: citizen.id,
                officerId: officer.id,
                policeStationId: officer.policeStationId,
                beatId: officer.beatId,
                visitType: 'Routine',
                scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'Completed',
                completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                duration: 30,
                notes: 'Regular welfare check completed.'
            }
        });
        visitCount++;

        // Upcoming visit
        await prisma.visit.create({
            data: {
                seniorCitizenId: citizen.id,
                officerId: officer.id,
                policeStationId: officer.policeStationId,
                beatId: officer.beatId,
                visitType: 'Routine',
                scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                status: 'Scheduled',
                notes: 'Scheduled welfare visit'
            }
        });
        visitCount++;
    }
    console.log(`Created ${visitCount} visits\n`);

    // Create Citizen Auth
    console.log('Creating Citizen Auth records...');
    const hashedPassword = await bcrypt.hash('Citizen@123', 10);

    for (const citizen of citizens) {
        await prisma.citizenAuth.upsert({
            where: { mobileNumber: citizen.mobileNumber },
            update: {},
            create: {
                mobileNumber: citizen.mobileNumber,
                password: hashedPassword,
                citizenId: citizen.id,
                isVerified: true
            }
        });
    }
    console.log(`Created ${citizens.length} citizen auth records\n`);

    console.log('Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`   - Beats: ${beats.length}`);
    console.log(`   - Beat Officers: ${officers.length}`);
    console.log(`   - Senior Citizens: ${citizens.length}`);
    console.log(`   - Visits: ${visitCount}`);
    console.log(`   - Citizen Auth: ${citizens.length}\n`);
    console.log('Test Login Credentials:');
    console.log('   Phone: 9876543230');
    console.log('   Password: Citizen@123\n');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
