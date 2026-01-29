import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = prisma as any;

interface DemoCitizen {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    mobileNumber: string;
    alternateMobile?: string;
    email?: string;
    permanentAddress: string;
    presentAddress?: string;
    pinCode: string;
    vulnerabilityLevel: 'Low' | 'Medium' | 'High';
    idVerificationStatus: 'Pending' | 'Approved' | 'Rejected';
    maritalStatus?: string;
    livingArrangement?: string;
    occupation?: string;
    languagesKnown?: string[];
    familyMembers?: Array<{
        name: string;
        relation: string;
        mobileNumber?: string;
        age?: number;
        isPrimaryContact?: boolean;
    }>;
    emergencyContacts: Array<{
        name: string;
        relation: string;
        mobileNumber: string;
        address?: string;
        email?: string;
        isPrimary?: boolean;
    }>;
}

const demoCitizens: DemoCitizen[] = [
    {
        fullName: 'Rajesh Kumar',
        gender: 'Male',
        dateOfBirth: '1950-03-12',
        mobileNumber: '9000000001',
        alternateMobile: '9000000101',
        email: 'rajesh.kumar@example.com',
        permanentAddress: 'A-12, Saket, New Delhi',
        presentAddress: 'A-12, Saket, New Delhi',
        pinCode: '110017',
        vulnerabilityLevel: 'High',
        idVerificationStatus: 'Approved',
        maritalStatus: 'Married',
        livingArrangement: 'With Family',
        occupation: 'Retired Govt Officer',
        languagesKnown: ['Hindi', 'English'],
        familyMembers: [
            {
                name: 'Anita Kumar',
                relation: 'Spouse',
                mobileNumber: '9000000201',
                isPrimaryContact: true
            },
            {
                name: 'Rohit Kumar',
                relation: 'Son',
                mobileNumber: '9000000202'
            }
        ],
        emergencyContacts: [
            {
                name: 'Rohit Kumar',
                relation: 'Son',
                mobileNumber: '9000000202',
                address: 'Gurugram, Haryana',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Leela Sharma',
        gender: 'Female',
        dateOfBirth: '1954-08-22',
        mobileNumber: '9000000002',
        alternateMobile: '9000000102',
        email: 'leela.sharma@example.com',
        permanentAddress: 'B-21, Greater Kailash, New Delhi',
        pinCode: '110048',
        vulnerabilityLevel: 'Medium',
        idVerificationStatus: 'Pending',
        maritalStatus: 'Widowed',
        livingArrangement: 'With Daughter',
        occupation: 'Retired Teacher',
        languagesKnown: ['Hindi', 'English'],
        familyMembers: [
            {
                name: 'Shruti Malhotra',
                relation: 'Daughter',
                mobileNumber: '9000000203',
                isPrimaryContact: true
            }
        ],
        emergencyContacts: [
            {
                name: 'Shruti Malhotra',
                relation: 'Daughter',
                mobileNumber: '9000000203',
                address: 'Noida, Uttar Pradesh',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Iqbal Hussain',
        gender: 'Male',
        dateOfBirth: '1948-11-05',
        mobileNumber: '9000000003',
        permanentAddress: 'H-88, Shaheen Bagh, New Delhi',
        presentAddress: 'H-88, Shaheen Bagh, New Delhi',
        pinCode: '110025',
        vulnerabilityLevel: 'Low',
        idVerificationStatus: 'Approved',
        maritalStatus: 'Married',
        occupation: 'Retired Banker',
        languagesKnown: ['Hindi', 'Urdu', 'English'],
        familyMembers: [
            {
                name: 'Sahar Hussain',
                relation: 'Spouse',
                mobileNumber: '9000000204',
                isPrimaryContact: true
            }
        ],
        emergencyContacts: [
            {
                name: 'Sahar Hussain',
                relation: 'Spouse',
                mobileNumber: '9000000204',
                address: 'New Delhi',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Veena Nair',
        gender: 'Female',
        dateOfBirth: '1955-01-19',
        mobileNumber: '9000000004',
        permanentAddress: 'C-44, CR Park, New Delhi',
        pinCode: '110019',
        vulnerabilityLevel: 'Medium',
        idVerificationStatus: 'Approved',
        maritalStatus: 'Married',
        livingArrangement: 'With Spouse',
        occupation: 'Retired Professor',
        languagesKnown: ['Malayalam', 'Hindi', 'English'],
        familyMembers: [
            {
                name: 'Suresh Nair',
                relation: 'Spouse',
                mobileNumber: '9000000205',
                isPrimaryContact: true
            }
        ],
        emergencyContacts: [
            {
                name: 'Suresh Nair',
                relation: 'Spouse',
                mobileNumber: '9000000205',
                address: 'New Delhi',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Harish Gupta',
        gender: 'Male',
        dateOfBirth: '1949-12-30',
        mobileNumber: '9000000005',
        permanentAddress: '56, Rajouri Garden, New Delhi',
        pinCode: '110027',
        vulnerabilityLevel: 'High',
        idVerificationStatus: 'Pending',
        maritalStatus: 'Married',
        livingArrangement: 'With Spouse',
        occupation: 'Retired Business Owner',
        languagesKnown: ['Hindi', 'Punjabi', 'English'],
        familyMembers: [
            {
                name: 'Poonam Gupta',
                relation: 'Spouse',
                mobileNumber: '9000000206',
                isPrimaryContact: true
            }
        ],
        emergencyContacts: [
            {
                name: 'Neha Batra',
                relation: 'Daughter',
                mobileNumber: '9000000207',
                address: 'Gurugram, Haryana',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Sunita Mehra',
        gender: 'Female',
        dateOfBirth: '1956-05-11',
        mobileNumber: '9000000006',
        permanentAddress: 'Green Apartment, Dwarka Sector 12, New Delhi',
        pinCode: '110078',
        vulnerabilityLevel: 'Low',
        idVerificationStatus: 'Approved',
        maritalStatus: 'Single',
        livingArrangement: 'Alone',
        occupation: 'Retired School Principal',
        languagesKnown: ['Hindi', 'English'],
        familyMembers: [
            {
                name: 'Anil Mehra',
                relation: 'Brother',
                mobileNumber: '9000000208',
                isPrimaryContact: true
            }
        ],
        emergencyContacts: [
            {
                name: 'Anil Mehra',
                relation: 'Brother',
                mobileNumber: '9000000208',
                address: 'Kanpur, UP',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Joseph D’Souza',
        gender: 'Male',
        dateOfBirth: '1951-04-03',
        mobileNumber: '9000000007',
        permanentAddress: 'Punjabi Bagh Club Road, New Delhi',
        pinCode: '110026',
        vulnerabilityLevel: 'Medium',
        idVerificationStatus: 'Approved',
        maritalStatus: 'Married',
        occupation: 'Retired Airline Staff',
        languagesKnown: ['Hindi', 'English'],
        emergencyContacts: [
            {
                name: 'Alison D’Souza',
                relation: 'Daughter',
                mobileNumber: '9000000209',
                address: 'Mumbai, Maharashtra',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Farzana Siddiqui',
        gender: 'Female',
        dateOfBirth: '1953-02-09',
        mobileNumber: '9000000008',
        permanentAddress: 'Shalimar Bagh, New Delhi',
        pinCode: '110088',
        vulnerabilityLevel: 'High',
        idVerificationStatus: 'Rejected',
        maritalStatus: 'Divorced',
        livingArrangement: 'With Son',
        occupation: 'Homemaker',
        languagesKnown: ['Hindi', 'English', 'Urdu'],
        emergencyContacts: [
            {
                name: 'Arshad Siddiqui',
                relation: 'Son',
                mobileNumber: '9000000210',
                address: 'New Delhi',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Baldev Singh',
        gender: 'Male',
        dateOfBirth: '1947-09-18',
        mobileNumber: '9000000009',
        permanentAddress: 'Janakpuri, New Delhi',
        pinCode: '110058',
        vulnerabilityLevel: 'Low',
        idVerificationStatus: 'Approved',
        maritalStatus: 'Married',
        occupation: 'Retired Army Officer',
        languagesKnown: ['Hindi', 'Punjabi', 'English'],
        emergencyContacts: [
            {
                name: 'Karan Singh',
                relation: 'Son',
                mobileNumber: '9000000211',
                address: 'Chandigarh',
                isPrimary: true
            }
        ]
    },
    {
        fullName: 'Meera Joshi',
        gender: 'Female',
        dateOfBirth: '1958-07-26',
        mobileNumber: '9000000010',
        permanentAddress: 'Lajpat Nagar, New Delhi',
        pinCode: '110024',
        vulnerabilityLevel: 'Medium',
        idVerificationStatus: 'Pending',
        maritalStatus: 'Separated',
        occupation: 'Retired Banker',
        languagesKnown: ['Hindi', 'English'],
        emergencyContacts: [
            {
                name: 'Isha Joshi',
                relation: 'Daughter',
                mobileNumber: '9000000212',
                address: 'New Delhi',
                isPrimary: true
            }
        ]
    }
];

const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

async function seedCitizens() {
    console.log('Seeding Senior Citizens...');

    for (const citizen of demoCitizens) {
        const {
            dateOfBirth,
            familyMembers,
            emergencyContacts,
            languagesKnown = ['Hindi'],
            ...rest
        } = citizen;

        // Ensure we start fresh for each demo record
        await db.seniorCitizen.deleteMany({
            where: { mobileNumber: citizen.mobileNumber }
        });

        await db.seniorCitizen.create({
            data: {
                ...rest,
                dateOfBirth: new Date(dateOfBirth),
                age: calculateAge(dateOfBirth),
                languagesKnown,
                consentDataUse: true,
                consentToNotifyFamily: true,
                consentShareHealth: true,
                consentNotifications: true,
                consentServiceRequest: true,
                consentScheduledVisitReminder: true,
                consentAcceptedOn: new Date(),
                consentVersion: 'v1.0',
                officialRemarks: 'Seeded demo record',
                createdBy: 'seed-script',
                updatedBy: 'seed-script',
                emergencyContacts: emergencyContacts?.length
                    ? {
                        create: emergencyContacts
                    }
                    : undefined,
                familyMembers: familyMembers?.length
                    ? {
                        create: familyMembers
                    }
                    : undefined
            }
        });
    }

    console.log(`Seeded ${demoCitizens.length} senior citizens`);
}

seedCitizens()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
