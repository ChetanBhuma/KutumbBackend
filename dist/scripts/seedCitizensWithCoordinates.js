"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Delhi Police Station coordinates (sample data)
const delhiPoliceStations = [
    {
        name: 'Connaught Place',
        district: 'New Delhi',
        range: 'Central',
        coordinates: { lat: 28.6315, lng: 77.2167 },
        beat: 'CP-Beat-1'
    },
    {
        name: 'Karol Bagh',
        district: 'Central',
        range: 'Central',
        coordinates: { lat: 28.6519, lng: 77.1900 },
        beat: 'KB-Beat-1'
    },
    {
        name: 'Rohini',
        district: 'Rohini',
        range: 'Outer',
        coordinates: { lat: 28.7495, lng: 77.0736 },
        beat: 'RH-Beat-1'
    },
    {
        name: 'Dwarka',
        district: 'South West',
        range: 'South West',
        coordinates: { lat: 28.5921, lng: 77.0460 },
        beat: 'DW-Beat-1'
    },
    {
        name: 'Saket',
        district: 'South',
        range: 'South',
        coordinates: { lat: 28.5244, lng: 77.2066 },
        beat: 'SK-Beat-1'
    },
    {
        name: 'Lajpat Nagar',
        district: 'South East',
        range: 'South East',
        coordinates: { lat: 28.5677, lng: 77.2431 },
        beat: 'LN-Beat-1'
    },
    {
        name: 'Mayur Vihar',
        district: 'East',
        range: 'East',
        coordinates: { lat: 28.6078, lng: 77.2982 },
        beat: 'MV-Beat-1'
    },
    {
        name: 'Model Town',
        district: 'North West',
        range: 'North West',
        coordinates: { lat: 28.7196, lng: 77.1910 },
        beat: 'MT-Beat-1'
    }
];
// Sample citizen names
const maleNames = [
    'Ramesh Kumar', 'Suresh Sharma', 'Rajesh Gupta', 'Mahesh Singh',
    'Dinesh Verma', 'Naresh Agarwal', 'Mukesh Jain', 'Rakesh Malhotra',
    'Ashok Kumar', 'Vijay Sharma', 'Anil Gupta', 'Sanjay Singh'
];
const femaleNames = [
    'Sunita Devi', 'Kamla Sharma', 'Savitri Gupta', 'Radha Singh',
    'Geeta Verma', 'Sita Agarwal', 'Laxmi Jain', 'Parvati Malhotra',
    'Shakuntala Devi', 'Urmila Sharma', 'Kaushalya Gupta', 'Sumitra Singh'
];
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function getRandomCoordinateNear(lat, lng, radiusKm = 2) {
    // Generate random point within radius
    const radiusInDegrees = radiusKm / 111; // Rough conversion
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    return {
        lat: lat + x,
        lng: lng + y
    };
}
function getRandomAge(min = 60, max = 90) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomPhone() {
    const prefix = ['98', '99', '97', '96', '95', '94', '93', '92', '91', '90'];
    const randomPrefix = getRandomElement(prefix);
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    return `+91${randomPrefix}${randomNumber}`;
}
function getDateOfBirth(age) {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1;
    return new Date(birthYear, birthMonth, birthDay);
}
async function seedCitizens() {
    console.log('🌱 Starting to seed citizens with GPS coordinates...');
    try {
        // First, get or create districts, police stations, and beats
        for (const ps of delhiPoliceStations) {
            // Create or get district
            let district = await prisma.district.findFirst({
                where: { name: ps.district }
            });
            if (!district) {
                // Generate unique code from district name
                const districtCode = ps.district.replace(/\s+/g, '').substring(0, 6).toUpperCase();
                district = await prisma.district.create({
                    data: {
                        name: ps.district,
                        code: districtCode,
                        range: ps.range,
                        area: '100', // Default area in sq km
                        headquarters: ps.name, // Use PS name as headquarters
                        isActive: true
                    }
                });
                console.log(`✅ Created district: ${district.name}`);
            }
            // Create or get police station
            let policeStation = await prisma.policeStation.findFirst({
                where: { name: ps.name, districtId: district.id }
            });
            if (!policeStation) {
                policeStation = await prisma.policeStation.create({
                    data: {
                        name: ps.name,
                        code: ps.name.substring(0, 3).toUpperCase(),
                        address: `${ps.name}, ${ps.district}, Delhi`,
                        districtId: district.id,
                        latitude: ps.coordinates.lat,
                        longitude: ps.coordinates.lng,
                        isActive: true
                    }
                });
                console.log(`✅ Created police station: ${policeStation.name}`);
            }
            // Create or get beat
            let beat = await prisma.beat.findFirst({
                where: { name: ps.beat, policeStationId: policeStation.id }
            });
            if (!beat) {
                beat = await prisma.beat.create({
                    data: {
                        name: ps.beat,
                        code: ps.beat,
                        policeStationId: policeStation.id,
                        isActive: true
                    }
                });
                console.log(`✅ Created beat: ${beat.name}`);
            }
            // Create 3-5 citizens per police station area
            const citizenCount = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < citizenCount; i++) {
                const isMale = Math.random() > 0.5;
                const fullName = isMale ? getRandomElement(maleNames) : getRandomElement(femaleNames);
                const age = getRandomAge();
                const dob = getDateOfBirth(age);
                const coords = getRandomCoordinateNear(ps.coordinates.lat, ps.coordinates.lng);
                const mobileNumber = getRandomPhone();
                const vulnerabilityLevels = ['Low', 'Medium', 'High'];
                const verificationStatuses = ['Pending', 'Verified', 'Verified', 'Verified']; // More approved than pending
                const mobilityStatuses = ['Normal', 'UsesStick', 'Wheelchair', 'Bedridden'];
                const citizen = await prisma.seniorCitizen.create({
                    data: {
                        fullName,
                        dateOfBirth: dob,
                        age,
                        gender: isMale ? 'Male' : 'Female',
                        mobileNumber,
                        permanentAddress: `House No. ${Math.floor(Math.random() * 999) + 1}, Sector ${Math.floor(Math.random() * 20) + 1}, ${ps.name}, ${ps.district}, Delhi`,
                        pinCode: `110${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
                        gpsLatitude: coords.lat,
                        gpsLongitude: coords.lng,
                        districtId: district.id,
                        policeStationId: policeStation.id,
                        beatId: beat.id,
                        vulnerabilityLevel: getRandomElement(vulnerabilityLevels),
                        idVerificationStatus: getRandomElement(verificationStatuses),
                        livingArrangement: getRandomElement(['Alone', 'With Spouse', 'With Family']),
                        mobilityStatus: getRandomElement(mobilityStatuses),
                        consentDataUse: true,
                        srCitizenUniqueId: `SC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                        isActive: true,
                        EmergencyContact: {
                            create: {
                                name: `${fullName.split(' ')[0]} ${isMale ? 'Son' : 'Daughter'}`,
                                relation: isMale ? 'Son' : 'Daughter',
                                mobileNumber: getRandomPhone(),
                                isPrimary: true
                            }
                        }
                    }
                });
                console.log(`✅ Created citizen: ${citizen.fullName} at ${ps.name} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
            }
        }
        const totalCitizens = await prisma.seniorCitizen.count();
        console.log(`\n🎉 Successfully seeded ${totalCitizens} citizens with GPS coordinates!`);
    }
    catch (error) {
        console.error('❌ Error seeding citizens:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
seedCitizens()
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=seedCitizensWithCoordinates.js.map