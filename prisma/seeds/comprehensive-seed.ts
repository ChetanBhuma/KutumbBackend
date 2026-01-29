import { PrismaClient, IdentityStatus, VisitStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting comprehensive database seed...\n');

    // ... (cleanup and master data creation skippped for brevity in this replacement, assume they are fine or will be untouched by this block if I only target specific lines. Wait, I should do multiple replacements or one big one if they are scattered.)
    // Better to use multi_replace for distributed changes.

    // Let's use multi_replace.


    // Step 1: Clean up existing data in correct order (respecting foreign keys)
    console.log('Cleaning existing data...');
    await prisma.sOSAlert.deleteMany({});
    await prisma.visitFeedback.deleteMany({});
    await prisma.visit.deleteMany({});
    await prisma.emergencyContact.deleteMany({});
    await prisma.familyMember.deleteMany({});
    await prisma.citizenAuth.deleteMany({});
    await prisma.citizenRegistration.deleteMany({});
    await prisma.visitRequest.deleteMany({});
    await prisma.verificationRequest.deleteMany({});
    await prisma.vulnerabilityHistory.deleteMany({});
    await prisma.serviceRequest.deleteMany({});
    await prisma.spouseDetails.deleteMany({});
    await prisma.officerLeave.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.seniorCitizen.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.beatOfficer.deleteMany({});
    await prisma.beat.deleteMany({});
    await prisma.policeStation.deleteMany({});
    await prisma.district.deleteMany({});
    console.log('Cleanup complete\n');

    // Step 2: Create Districts
    console.log('Creating Districts...');
    const districts = await Promise.all([
        prisma.district.create({
            data: {
                name: 'Central Delhi',
                code: 'CD',
                range: 'Delhi Range',
                area: 'Central',
                headquarters: 'Kamla Market'
            }
        }),
        prisma.district.create({
            data: {
                name: 'South Delhi',
                code: 'SD',
                range: 'Delhi Range',
                area: 'South',
                headquarters: 'Hauz Khas'
            }
        }),
        prisma.district.create({
            data: {
                name: 'West Delhi',
                code: 'WD',
                range: 'Delhi Range',
                area: 'West',
                headquarters: 'Rajouri Garden'
            }
        })
    ]);
    console.log(`Created ${districts.length} districts\n`);

    // Step 3: Create Police Stations
    console.log('Creating Police Stations...');
    const policeStations = await Promise.all([
        prisma.policeStation.create({
            data: {
                name: 'Connaught Place PS',
                code: 'CP-PS',
                districtId: districts[0].id,
                address: 'Connaught Place, New Delhi',
                phone: '011-23412345'
            }
        }),
        prisma.policeStation.create({
            data: {
                name: 'Saket PS',
                code: 'SKT-PS',
                districtId: districts[1].id,
                address: 'Saket, New Delhi',
                phone: '011-26512345'
            }
        }),
        prisma.policeStation.create({
            data: {
                name: 'Rajouri Garden PS',
                code: 'RG-PS',
                districtId: districts[2].id,
                address: 'Rajouri Garden, New Delhi',
                phone: '011-25412345'
            }
        })
    ]);
    console.log(`Created ${policeStations.length} police stations\n`);

    // Step 4: Create Beats
    console.log('Creating Beats...');
    const beats = await Promise.all([
        prisma.beat.create({
            data: {
                name: 'CP Beat 1',
                code: 'CP-B1',
                policeStationId: policeStations[0].id,
                boundaries: 'Inner Circle to Outer Circle'
            }
        }),
        prisma.beat.create({
            data: {
                name: 'Saket Beat 1',
                code: 'SKT-B1',
                policeStationId: policeStations[1].id,
                boundaries: 'Saket Metro to Malviya Nagar'
            }
        }),
        prisma.beat.create({
            data: {
                name: 'Rajouri Beat 1',
                code: 'RG-B1',
                policeStationId: policeStations[2].id,
                boundaries: 'Main Market to Tagore Garden'
            }
        })
    ]);
    console.log(`Created ${beats.length} beats\n`);

    // Step 5: Create Beat Officers
    console.log('Creating Beat Officers...');
    const officers = await Promise.all([
        prisma.beatOfficer.create({
            data: {
                name: 'Constable Rajesh Kumar',
                badgeNumber: 'DCP-001',
                rank: 'Constable',
                mobileNumber: '9876543210',
                email: 'rajesh.kumar@delhipolice.gov.in',
                policeStationId: policeStations[0].id,
                beatId: beats[0].id
            }
        }),
        prisma.beatOfficer.create({
            data: {
                name: 'Constable Priya Sharma',
                badgeNumber: 'DCP-002',
                rank: 'Constable',
                mobileNumber: '9876543211',
                email: 'priya.sharma@delhipolice.gov.in',
                policeStationId: policeStations[1].id,
                beatId: beats[1].id
            }
        }),
        prisma.beatOfficer.create({
            data: {
                name: 'Head Constable Vikram Singh',
                badgeNumber: 'DCP-003',
                rank: 'Head Constable',
                mobileNumber: '9876543212',
                email: 'vikram.singh@delhipolice.gov.in',
                policeStationId: policeStations[2].id,
                beatId: beats[2].id
            }
        })
    ]);
    console.log(`Created ${officers.length} beat officers\n`);

    // Step 6: Create Senior Citizens
    console.log('Creating Senior Citizens...');
    const calculateAge = (dob: Date) => {
        const diff = Date.now() - dob.getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };

    const citizenData = [
        {
            fullName: 'Mr. Ram Prasad',
            gender: 'Male',
            dob: new Date('1950-03-15'),
            mobile: '9876543230',
            address: 'A-12, Saket, New Delhi',
            pinCode: '110017',
            districtId: districts[1].id,
            policeStationId: policeStations[1].id,
            beatId: beats[1].id,
            vulnerability: 'High',
            status: 'Approved'
        },
        {
            fullName: 'Mrs. Kamla Devi',
            gender: 'Female',
            dob: new Date('1952-07-22'),
            mobile: '9876543231',
            address: 'B-21, Greater Kailash, New Delhi',
            pinCode: '110048',
            districtId: districts[1].id,
            policeStationId: policeStations[1].id,
            beatId: beats[1].id,
            vulnerability: 'Medium',
            status: 'Approved'
        },
        {
            fullName: 'Mr. Suresh Kumar',
            gender: 'Male',
            dob: new Date('1948-11-05'),
            mobile: '9876543232',
            address: 'H-88, Connaught Place, New Delhi',
            pinCode: '110001',
            districtId: districts[0].id,
            policeStationId: policeStations[0].id,
            beatId: beats[0].id,
            vulnerability: 'Low',
            status: 'Approved'
        },
        {
            fullName: 'Mrs. Sunita Sharma',
            gender: 'Female',
            dob: new Date('1955-01-19'),
            mobile: '9876543233',
            address: 'C-44, Rajouri Garden, New Delhi',
            pinCode: '110027',
            districtId: districts[2].id,
            policeStationId: policeStations[2].id,
            beatId: beats[2].id,
            vulnerability: 'Medium',
            status: 'Approved'
        },
        {
            fullName: 'Mr. Harish Gupta',
            gender: 'Male',
            dob: new Date('1949-12-30'),
            mobile: '9876543234',
            address: '56, Dwarka Sector 12, New Delhi',
            pinCode: '110078',
            districtId: districts[2].id,
            policeStationId: policeStations[2].id,
            beatId: beats[2].id,
            vulnerability: 'High',
            status: 'Pending'
        },
        {
            fullName: 'Mrs. Meera Joshi',
            gender: 'Female',
            dob: new Date('1958-07-26'),
            mobile: '9876543235',
            address: 'Green Apartment, Saket, New Delhi',
            pinCode: '110017',
            districtId: districts[1].id,
            policeStationId: policeStations[1].id,
            beatId: beats[1].id,
            vulnerability: 'Low',
            status: 'Pending'
        },
        {
            fullName: 'Mr. Baldev Singh',
            gender: 'Male',
            dob: new Date('1947-09-18'),
            mobile: '9876543236',
            address: 'Punjabi Bagh, New Delhi',
            pinCode: '110026',
            districtId: districts[2].id,
            policeStationId: policeStations[2].id,
            beatId: beats[2].id,
            vulnerability: 'Medium',
            status: 'Approved'
        },
        {
            fullName: 'Mrs. Veena Nair',
            gender: 'Female',
            dob: new Date('1953-02-09'),
            mobile: '9876543237',
            address: 'Lajpat Nagar, New Delhi',
            pinCode: '110024',
            districtId: districts[1].id,
            policeStationId: policeStations[1].id,
            beatId: beats[1].id,
            vulnerability: 'High',
            status: 'Rejected'
        },
        {
            fullName: 'Mr. Ashok Verma',
            gender: 'Male',
            dob: new Date('1951-06-14'),
            mobile: '9876543238',
            address: 'Vasant Vihar, New Delhi',
            pinCode: '110057',
            districtId: districts[1].id,
            policeStationId: policeStations[1].id,
            beatId: beats[1].id,
            vulnerability: 'Low',
            status: 'Approved'
        },
        {
            fullName: 'Mrs. Lakshmi Iyer',
            gender: 'Female',
            dob: new Date('1954-10-08'),
            mobile: '9876543239',
            address: 'Karol Bagh, New Delhi',
            pinCode: '110005',
            districtId: districts[0].id,
            policeStationId: policeStations[0].id,
            beatId: beats[0].id,
            vulnerability: 'Medium',
            status: 'Approved'
        }
    ];

    const citizens: any[] = [];
    for (const data of citizenData) {
        const citizen = await prisma.seniorCitizen.create({
            data: {
                fullName: data.fullName,
                dateOfBirth: data.dob,
                age: calculateAge(data.dob),
                gender: data.gender,
                mobileNumber: data.mobile,
                permanentAddress: data.address,
                presentAddress: data.address,
                pinCode: data.pinCode,
                districtId: data.districtId,
                policeStationId: data.policeStationId,
                beatId: data.beatId,
                vulnerabilityLevel: data.vulnerability,
                idVerificationStatus: data.status === 'Approved' ? IdentityStatus.Verified : (data.status === 'Rejected' ? IdentityStatus.Rejected : IdentityStatus.Pending),
                maritalStatus: 'Married',
                nationality: 'Indian',
                languagesKnown: ['Hindi', 'English'],
                consentDataUse: true,
                srCitizenUniqueId: `SC-2025-${(1000 + citizens.length).toString()}`,

                // Master Data Alignment
                whatsappNumber: data.mobile,
                religion: ['Hindu', 'Sikh', 'Muslim', 'Christian'][Math.floor(Math.random() * 4)],
                yearOfRetirement: 2010 + Math.floor(Math.random() * 14),
                occupation: ['Retired Teacher', 'Former Govt Servant', 'Business', 'Housewife'][Math.floor(Math.random() * 4)],
                bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
                preferredContactMode: 'Call',
                healthInsuranceDetails: Math.random() > 0.5 ? 'CGHS - 123456789' : null,
                nearbyFamilyDetails: Math.random() > 0.5 ? 'Son lives in nearby colony' : 'No immediate family nearby',

                MedicalHistory: {
                    create: citizens.length % 3 === 0 ? [
                        { conditionName: 'Diabetes', sinceWhen: '2015', remarks: 'Under medication' }
                    ] : []
                },
                FamilyMember: {
                    create: [
                        {
                            name: 'Daughter',
                            relation: 'Daughter',
                            mobileNumber: `98765432${50 + citizens.length}`,
                            isPrimaryContact: false
                        }
                    ]
                },
                consentToNotifyFamily: true,
                consentShareHealth: true,
                consentNotifications: true,
                consentServiceRequest: true,
                registeredOnApp: true,
                isActive: true,
                gpsLatitude: 28.6139 + (Math.random() - 0.5) * 0.1,
                gpsLongitude: 77.2090 + (Math.random() - 0.5) * 0.1,
                EmergencyContact: {
                    create: [
                        {
                            name: 'Family Member',
                            relation: 'Son/Daughter',
                            mobileNumber: `98765432${40 + citizens.length}`,
                            address: data.address,
                            isPrimary: true
                        }
                    ]
                }
            }
        });
        citizens.push(citizen);
    }
    console.log(`Created ${citizens.length} senior citizens\n`);

    // Step 7: Create Visits
    console.log('Creating Visits...');
    const visits = [];
    for (let i = 0; i < citizens.length; i++) {
        const citizen = citizens[i];
        const officer = officers[i % officers.length];

        // Create past visit
        const pastVisit = await prisma.visit.create({
            data: {
                seniorCitizenId: citizen.id,
                officerId: officer.id,
                policeStationId: officer.policeStationId,
                beatId: officer.beatId,
                visitType: 'Routine',
                scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                status: VisitStatus.COMPLETED,
                completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                duration: 30,
                notes: 'Regular welfare check completed. Citizen is doing well.',
                // healthStatus and safetyStatus removed from schema
                // completedBy removed or not in schema? officerId is there. completedBy was likely an audit field logic not in schema directly or optional?
                // Schema has 'completedDate'. 'completedBy' logic is usually in AuditLog or implicitly officerId.
                // Re-checking Visit model: no completedBy field.

            }
        });
        visits.push(pastVisit);

        // Create upcoming visit
        const upcomingVisit = await prisma.visit.create({
            data: {
                seniorCitizenId: citizen.id,
                officerId: officer.id,
                policeStationId: officer.policeStationId,
                beatId: officer.beatId,
                visitType: 'Routine',
                scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                status: VisitStatus.SCHEDULED,
                notes: 'Scheduled welfare visit'
            }
        });
        visits.push(upcomingVisit);
    }
    console.log(`Created ${visits.length} visits\n`);

    // Step 8: Create Citizen Auth records
    console.log('Creating Citizen Auth records...');
    const hashedPassword = await bcrypt.hash('Citizen@123', 10);

    for (const citizen of citizens) {
        await prisma.citizenAuth.create({
            data: {
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
    console.log(`   - Districts: ${districts.length}`);
    console.log(`   - Police Stations: ${policeStations.length}`);
    console.log(`   - Beats: ${beats.length}`);
    console.log(`   - Beat Officers: ${officers.length}`);
    console.log(`   - Senior Citizens: ${citizens.length}`);
    console.log(`   - Visits: ${visits.length}`);
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
