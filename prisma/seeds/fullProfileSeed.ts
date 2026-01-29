import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = prisma as any;

const calculateAge = (dob: Date) => {
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

async function ensureOperationalData() {
    const policeStation = await db.policeStation.upsert({
        where: { code: 'PS_SAKET_DEMO' },
        update: {
            name: 'Saket Police Station',
            address: 'Saket District Centre, New Delhi',
            phone: '+91-1123456789',
        },
        create: {
            code: 'PS_SAKET_DEMO',
            name: 'Saket Police Station',
            address: 'Saket District Centre, New Delhi',
            phone: '+91-1123456789',
            email: 'saket.ps@delhipolice.gov.in',
        },
    });

    const beat = await db.beat.upsert({
        where: { code: 'BEAT_SAKET_DEMO' },
        update: {
            name: 'Saket Sector-1 Beat',
            policeStationId: policeStation.id,
            description: 'Demo beat covering Saket residential blocks',
        },
        create: {
            code: 'BEAT_SAKET_DEMO',
            name: 'Saket Sector-1 Beat',
            policeStationId: policeStation.id,
            description: 'Demo beat covering Saket residential blocks',
        },
    });

    const officerUser = await db.user.findUnique({ where: { email: 'officer-range@delhipolice.gov.in' } });

    const officer = await db.beatOfficer.upsert({
        where: { badgeNumber: 'DL-PS-SAKET-0001' },
        update: {
            name: 'Inspector Nikhil Sharma',
            rank: 'Inspector',
            mobileNumber: '+91-9811111111',
            policeStationId: policeStation.id,
            beatId: beat.id,
            userId: officerUser?.id || undefined
        },
        create: {
            badgeNumber: 'DL-PS-SAKET-0001',
            name: 'Inspector Nikhil Sharma',
            rank: 'Inspector',
            mobileNumber: '+91-9811111111',
            email: 'nikhil.sharma@delhipolice.gov.in',
            policeStationId: policeStation.id,
            beatId: beat.id,
            userId: officerUser?.id || undefined
        },
    });

    return { policeStation, beat, officer };
}

async function removeExistingCitizen(mobileNumber: string) {
    const existing = await db.seniorCitizen.findUnique({
        where: { mobileNumber },
        select: { id: true },
    });

    if (!existing) {
        return;
    }

    const citizenId = existing.id;

    await db.visit.deleteMany({ where: { seniorCitizenId: citizenId } });
    await db.serviceRequest.deleteMany({ where: { seniorCitizenId: citizenId } });
    await db.sOSAlert.deleteMany({ where: { seniorCitizenId: citizenId } });
    await db.document.deleteMany({ where: { seniorCitizenId: citizenId } });
    await db.householdHelp.deleteMany({ where: { seniorCitizenId: citizenId } });
    await db.familyMember.deleteMany({ where: { seniorCitizenId: citizenId } });
    await db.emergencyContact.deleteMany({ where: { seniorCitizenId: citizenId } });

    await db.seniorCitizen.delete({ where: { id: citizenId } });
}

async function seedFullProfile() {
    const { policeStation, beat, officer } = await ensureOperationalData();
    const demoMobile = '9998887770';
    await removeExistingCitizen(demoMobile);

    const dob = new Date('1952-06-15T00:00:00.000Z');
    const citizen = await db.seniorCitizen.create({
        data: {
            fullName: 'Sushila Devi',
            gender: 'Female',
            dateOfBirth: dob,
            age: calculateAge(dob),
            mobileNumber: demoMobile,
            alternateMobile: '9810098100',
            email: 'sushila.devi@example.com',
            aadhaarNumber: '567856785678',
            voterIdNumber: 'DL/12/345/678900',
            permanentAddress: 'B-102, Silver Heights Apartments, Saket, New Delhi',
            presentAddress: 'B-102, Silver Heights Apartments, Saket, New Delhi',
            pinCode: '110017',
            city: 'New Delhi',
            state: 'Delhi',
            vulnerabilityLevel: 'High',
            idVerificationStatus: 'Approved',
            maritalStatus: 'Widowed',
            livingArrangement: 'With Daughter',
            occupation: 'Retired School Principal',
            educationQualification: 'MA Education',
            yearOfRetirement: 2012,
            retiredFrom: 'Delhi Government Schools',
            languagesKnown: ['Hindi', 'English'],
            preferredContactMode: 'Call',
            policeStationId: policeStation.id,
            policeStationName: policeStation.name,
            policeStationCode: policeStation.code,
            beatId: beat.id,
            beatName: beat.name,
            beatCode: beat.code,
            preferredVisitDay: 'Tuesday',
            preferredVisitTime: 'Morning',
            visitNotes: 'Prefers morning visits with BP/sugar monitoring.',
            healthConditions: ['Hypertension', 'Type 2 Diabetes'],
            bloodGroup: 'O+',
            regularDoctor: 'Dr. Meenakshi Sharma',
            doctorContact: '+91-9876543210',
            emergencyHospitalPreference: 'Max Saket',
            mobilityConstraints: 'Uses walking cane for long distances',
            digitalCardIssued: true,
            digitalCardNumber: 'SC-DEMO-001',
            digitalCardIssueDate: new Date('2024-02-01T00:00:00.000Z'),
            srCitizenUniqueId: 'SC-2024-DEMO-0001',
            vulnerabilityScore: 78,
            lastAssessmentDate: new Date('2024-05-01T00:00:00.000Z'),
            nextScheduledVisitDate: new Date('2024-06-15T04:00:00.000Z'),
            visitRemarks: 'Monitor sugar readings; ensure medicine supply.',
            consentToNotifyFamily: true,
            consentShareHealth: true,
            consentNotifications: true,
            consentScheduledVisitReminder: true,
            consentServiceRequest: true,
            consentDataUse: true,
            consentAcceptedOn: new Date('2024-01-05T00:00:00.000Z'),
            consentVersion: 'v1.0',
            allowDataShareWithFamily: true,
            allowDataExport: true,
            createdBy: 'seed-script',
            updatedBy: 'seed-script',
            receivedBy: 'demo.officer@delhipolice.gov.in',
            officialRemarks: 'Demo full profile for UI verification',
            dataEntryCompletedBy: 'demo.officer@delhipolice.gov.in',
            dataEntryDate: new Date('2024-01-05T00:00:00.000Z'),
            interestedServices: ['Periodic Welfare Check', 'Medical Escort'],
            sourceSystem: 'full-profile-seed',
            familyMembers: {
                create: [
                    {
                        name: 'Aparna Mehta',
                        relation: 'Daughter',
                        age: 38,
                        mobileNumber: '9876543210',
                        isPrimaryContact: true,
                    },
                    {
                        name: 'Rahul Mehta',
                        relation: 'Son-in-law',
                        age: 40,
                        mobileNumber: '9812345678',
                        isPrimaryContact: false,
                    },
                ],
            },
            emergencyContacts: {
                create: [
                    {
                        name: 'Aparna Mehta',
                        relation: 'Daughter',
                        mobileNumber: '9876543210',
                        email: 'aparna.mehta@example.com',
                        address: 'DLF Phase 5, Gurugram',
                        isPrimary: true,
                    },
                    {
                        name: 'Rahul Mehta',
                        relation: 'Son-in-law',
                        mobileNumber: '9812345678',
                        email: 'rahul.mehta@example.com',
                        address: 'DLF Phase 5, Gurugram',
                        isPrimary: false,
                    },
                ],
            },
            householdHelp: {
                create: [
                    {
                        category: 'Caretaker',
                        name: 'Kavita Kumari',
                        mobileNumber: '9822001100',
                        address: 'Saket Village',
                        idProofType: 'Aadhaar',
                        idProofNumber: '778877887788',
                        verificationStatus: 'Verified',
                        startDate: new Date('2023-09-01T00:00:00.000Z'),
                        remarks: 'Day caretaker, 9 AM - 6 PM',
                    },
                ],
            },
            documents: {
                create: [
                    {
                        documentType: 'Photo ID',
                        documentName: 'Aadhaar Card',
                        fileUrl: 'https://example-cdn.seniorcare/aadhaar-sushila.pdf',
                        fileType: 'pdf',
                        fileSize: 256000,
                    },
                    {
                        documentType: 'Medical',
                        documentName: 'Recent Prescription',
                        fileUrl: 'https://example-cdn.seniorcare/prescription-apr24.pdf',
                        fileType: 'pdf',
                        fileSize: 180000,
                    },
                ],
            },
            serviceRequests: {
                create: [
                    {
                        serviceType: 'Medical Assistance',
                        description: 'Escort required for endocrinologist visit',
                        status: 'Completed',
                        priority: 'High',
                        assignedTo: officer.id,
                        resolution: 'Escort arranged and completed on 20 Apr 2024',
                        completedAt: new Date('2024-04-20T09:30:00.000Z'),
                    },
                    {
                        serviceType: 'Wellness Call',
                        description: 'Weekly wellbeing call on Fridays',
                        status: 'In Progress',
                        priority: 'Normal',
                        assignedTo: officer.id,
                    },
                ],
            },
            sosAlerts: {
                create: [
                    {
                        latitude: 28.5245,
                        longitude: 77.2067,
                        address: 'Saket, New Delhi',
                        status: 'Resolved',
                        respondedBy: officer.id,
                        respondedAt: new Date('2024-03-11T04:45:00.000Z'),
                        resolvedAt: new Date('2024-03-11T05:15:00.000Z'),
                        notes: 'Minor fall detected, first aid administered.',
                    },
                ],
            },
            visits: {
                create: [
                    {
                        officerId: officer.id,
                        policeStationId: policeStation.id,
                        beatId: beat.id,
                        visitType: 'Routine',
                        scheduledDate: new Date('2024-05-12T04:30:00.000Z'),
                        completedDate: new Date('2024-05-12T05:15:00.000Z'),
                        status: 'Completed',
                        notes: 'Vitals recorded, medication reviewed.',
                        duration: 45,
                    },
                    {
                        officerId: officer.id,
                        policeStationId: policeStation.id,
                        beatId: beat.id,
                        visitType: 'Follow-up',
                        scheduledDate: new Date('2024-06-15T04:00:00.000Z'),
                        status: 'Scheduled',
                        notes: 'Check on physiotherapy progress.',
                    },
                ],
            },
        },
        include: {
            familyMembers: true,
            emergencyContacts: true,
            visits: true,
            serviceRequests: true,
            sosAlerts: true,
        },
    });

    console.log('Seeded full citizen profile:');
    console.table({
        Name: citizen.fullName,
        Mobile: citizen.mobileNumber,
        Visits: citizen.visits.length,
        ServiceRequests: citizen.serviceRequests.length,
        SOSAlerts: citizen.sosAlerts.length,
    });
}

seedFullProfile()
    .catch((error) => {
        console.error('Failed to seed full profile', error);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
