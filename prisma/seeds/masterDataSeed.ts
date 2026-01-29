/**
 * Comprehensive Seed Data Script for Master Data Tables
 * Run this script to populate all master data with Delhi Police information
 *
 * Usage: npx ts-node backend/prisma/seeds/masterDataSeed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRoles() {
    console.log('Seeding Roles...');

    const roles = [
        {
            code: 'SUPER_ADMIN',
            name: 'Super Administrator',
            description: 'Full system access with all permissions',
            permissions: [
                'citizens.read', 'citizens.write', 'citizens.delete',
                'officers.read', 'officers.write', 'officers.delete', 'officers.manage',
                'visits.read', 'visits.schedule', 'visits.complete', 'visits.delete',
                'sos.read', 'sos.respond', 'sos.resolve',
                'reports.read', 'reports.generate', 'reports.export',
                'system.settings', 'audit.logs',
                'profile.read.own', 'profile.update.own',
                'visits.read.own', 'visits.request',
                'sos.create', 'sos.read.own',
                'documents.upload', 'documents.read.own',
                'feedback.submit', 'notifications.manage'
            ],
            isActive: true,
        },
        {
            code: 'ADMIN',
            name: 'Administrator',
            description: 'Administrative access with management permissions',
            permissions: [
                'citizens.read', 'citizens.write', 'citizens.delete',
                'officers.read', 'officers.write', 'officers.manage',
                'visits.read', 'visits.schedule', 'visits.complete',
                'sos.read', 'sos.respond', 'sos.resolve',
                'reports.read', 'reports.generate', 'reports.export',
                'system.settings'
            ],
            isActive: true,
        },
        {
            code: 'OFFICER',
            name: 'Police Officer',
            description: 'Field officer with operational permissions',
            permissions: [
                'citizens.read',
                'visits.read', 'visits.complete',
                'sos.read', 'sos.respond',
                'reports.read'
            ],
            isActive: true,
        },
        {
            code: 'SUPERVISOR',
            name: 'Supervisor',
            description: 'Supervisory role with approval permissions',
            permissions: [
                'citizens.read', 'citizens.write',
                'visits.read', 'visits.schedule', 'visits.complete',
                'sos.read', 'sos.respond', 'sos.resolve',
                'officers.read',
                'reports.read', 'reports.generate'
            ],
            isActive: true,
        },
        {
            code: 'VIEWER',
            name: 'Viewer',
            description: 'Read-only access to system data',
            permissions: [
                'citizens.read',
                'officers.read',
                'visits.read',
                'reports.read'
            ],
            isActive: true,
        },
        {
            code: 'CONTROL_ROOM',
            name: 'Control Room Operator',
            description: 'Monitors SOS alerts and dispatches officers',
            permissions: [
                'sos.read', 'sos.respond', 'sos.resolve',
                'officers.read',
                'citizens.read',
                'visits.read'
            ],
            isActive: true,
        },
        {
            code: 'DATA_ENTRY',
            name: 'Data Entry Operator',
            description: 'Digitizes physical forms and manages documents',
            permissions: [
                'citizens.read', 'citizens.write',
                'documents.upload'
            ],
            isActive: true,
        },
        {
            code: 'CITIZEN',
            name: 'Senior Citizen',
            description: 'Registered senior citizen with self-service permissions',
            permissions: [
                'profile.read.own', 'profile.update.own',
                'visits.read.own', 'visits.request',
                'sos.create', 'sos.read.own',
                'documents.upload', 'documents.read.own',
                'feedback.submit', 'notifications.manage'
            ],
            isActive: true,
        },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { code: role.code },
            update: role,
            create: role,
        });
    }

    console.log(`Created ${roles.length} roles`);
}

async function seedRanges() {
    console.log('Seeding Ranges...');
    const ranges = [
        { name: 'Northern Range', code: 'NORTH' },
        { name: 'Southern Range', code: 'SOUTH' },
        { name: 'Eastern Range', code: 'EAST' },
        { name: 'Western Range', code: 'WEST' },
        { name: 'Central Range', code: 'CENTRAL' },
        { name: 'New Delhi Range', code: 'NEW_DELHI' }
    ];

    for (const range of ranges) {
        await prisma.range.upsert({
            where: { code: range.code },
            update: { name: range.name },
            create: { name: range.name, code: range.code }
        });
    }
    console.log(`Created ${ranges.length} ranges`);
}

async function seedDistricts() {
    console.log('Seeding Districts...');

    // Fetch ranges to map IDs
    const ranges = await prisma.range.findMany();
    const rangeMap = ranges.reduce((acc, r) => ({ ...acc, [r.code!]: r.id }), {} as Record<string, string>);

    const districts = [
        // NORTH RANGE
        { code: 'ND_NORTH', name: 'North District', rangeCode: 'NORTH', area: '60.5', population: 887978, headquarters: 'Mukherjee Nagar', isActive: true },
        { code: 'ND_NORTHWEST', name: 'North-West District', rangeCode: 'NORTH', area: '42.2', population: 3656539, headquarters: 'Rohini', isActive: true },
        { code: 'ND_NORTHEAST', name: 'North-East District', rangeCode: 'NORTH', area: '62.6', population: 2241624, headquarters: 'Nand Nagri', isActive: true },
        { code: 'ND_ROHINI', name: 'Rohini District', rangeCode: 'NORTH', area: '40.0', population: 1500000, headquarters: 'Rohini Sector-23', isActive: true }, // Added to match 15 eventually? Or stick to known ones.

        // SOUTH RANGE
        { code: 'ND_SOUTH', name: 'South District', rangeCode: 'SOUTH', area: '250.49', population: 2733752, headquarters: 'Saket', isActive: true },
        { code: 'ND_SOUTHWEST', name: 'South-West District', rangeCode: 'SOUTH', area: '420', population: 2292958, headquarters: 'Dwarka', isActive: true },
        { code: 'ND_SOUTHEAST', name: 'South-East District', rangeCode: 'SOUTH', area: '93', population: 1470654, headquarters: 'Defence Colony', isActive: true },

        // EAST RANGE
        { code: 'ND_EAST', name: 'East District', rangeCode: 'EAST', area: '64.5', population: 1709346, headquarters: 'Preet Vihar', isActive: true },
        { code: 'ND_SHAHDARA', name: 'Shahdara District', rangeCode: 'EAST', area: '74.5', population: 1511294, headquarters: 'Shahdara', isActive: true },

        // WEST RANGE
        { code: 'ND_WEST', name: 'West District', rangeCode: 'WEST', area: '129.35', population: 2543243, headquarters: 'Rajouri Garden', isActive: true },
        { code: 'ND_OUTER', name: 'Outer District', rangeCode: 'WEST', area: '112.87', population: 2241943, headquarters: 'Nangloi', isActive: true },
        { code: 'ND_DWARKA', name: 'Dwarka District', rangeCode: 'WEST', area: '100.0', population: 1800000, headquarters: 'Dwarka Sec-19', isActive: true },

        // CENTRAL RANGE
        { code: 'ND_CENTRAL', name: 'Central District', rangeCode: 'CENTRAL', area: '25.69', population: 644005, headquarters: 'Kamla Market', isActive: true },
        { code: 'ND_NORTH_CENTRAL', name: 'North Central', rangeCode: 'CENTRAL', area: '20.0', population: 500000, headquarters: 'Daryaganj', isActive: true }, // Placeholder

        // NEW DELHI RANGE
        { code: 'ND_NEWDELHI', name: 'New Delhi District', rangeCode: 'NEW_DELHI', area: '35.84', population: 142004, headquarters: 'Mandir Marg', isActive: true },
    ];

    for (const districtData of districts) {
        const { rangeCode, ...data } = districtData;

        await prisma.district.upsert({
            where: { code: data.code },
            update: {
                ...data,
                rangeId: rangeMap[rangeCode] // Link to Range
            },
            create: {
                ...data,
                rangeId: rangeMap[rangeCode]
            },
        });
    }

    console.log(`Created ${districts.length} districts`);
}

async function seedSubDivisions() {
    console.log('Seeding Sub-Divisions...');
    const districts = await prisma.district.findMany();

    // Generic generator for now: 4-5 SDs per district = ~60-75
    let count = 0;
    for (const district of districts) {
        const sdCount = 5;
        for (let i = 1; i <= sdCount; i++) {
            const code = `SD_${district.code}_${i}`;
            const name = `${district.name} Sub-Division ${i}`;

            await prisma.subDivision.upsert({
                where: { code },
                update: {
                    name,
                    districtId: district.id
                },
                create: {
                    code,
                    name,
                    districtId: district.id,
                    isActive: true
                }
            });
            count++;
        }
    }
    console.log(`Created ${count} sub-divisions`);
}

async function seedPoliceStations() {
    console.log('Seeding Police Stations...');

    // Fetch SubDivisions to link
    const subDivisions = await prisma.subDivision.findMany({ include: { District: true } });

    // Create ~3 stations per SD -> ~210 stations (close to 226)
    let count = 0;
    for (const sd of subDivisions) {
        for (let i = 1; i <= 3; i++) {
            const code = `PS_${sd.code}_${i}`;
            const name = `Station ${i} - ${sd.name}`;

            await prisma.policeStation.upsert({
                where: { code },
                update: {
                    name,
                    subDivisionId: sd.id,
                    districtId: sd.districtId,
                    rangeId: await getRangeIdForDistrict(sd.districtId) // Helper or direct access
                },
                create: {
                    code,
                    name,
                    subDivisionId: sd.id,
                    districtId: sd.districtId,
                    rangeId: await getRangeIdForDistrict(sd.districtId),
                    isActive: true,
                    address: `Address for ${name}`,
                    phone: '100'
                }
            });
            count++;
        }
    }

    console.log(`Created ${count} police stations`);
}

// Helper to get Range ID (optimization: cache map if slow, but fine for seed)
async function getRangeIdForDistrict(districtId: string) {
    const district = await prisma.district.findUnique({ where: { id: districtId }, select: { rangeId: true }});
    return district?.rangeId;
}

// Keep seedDesignations as is, but remove old seedDistricts/seedPoliceStations calls if I replaced them
// Wait, I am using 'replace_file_content' from line 134 to 236.
// I need to ensure I don't break the file structure.
// lines 134-236 contained seedDistricts, seedPoliceStations, seedDesignations.
// I need to include seedDesignations in my replacement or keep it!
// My replacement DOES NOT include seedDesignations logic (I didn't write it in ReplacementContent).
// So I should only replace seedDistricts and seedPoliceStations, and keep seedDesignations.
// seedDistricts starts at 134, ends at 170.
// seedPoliceStations starts at 172, ends at 192.
// seedDesignations starts at 194.

// So I should replace from 134 to 192.


async function seedDesignations() {
    console.log('Seeding Designations...');

    const designations = [
        // POLICE DEPARTMENT - Higher Ranks
        { code: 'DGP', name: 'Director General of Police', department: 'POLICE', level: 1, description: 'Head of police force, highest rank', isActive: true },
        { code: 'ADGP', name: 'Additional DGP', department: 'POLICE', level: 2, description: 'Additional director general', isActive: true },
        { code: 'IGP', name: 'Inspector General of Police', department: 'POLICE', level: 3, description: 'Range/Zone commander', isActive: true },
        { code: 'DCP', name: 'Deputy Commissioner of Police', department: 'POLICE', level: 4, description: 'District head', isActive: true },
        { code: 'ACP', name: 'Assistant Commissioner of Police', department: 'POLICE', level: 5, description: 'Sub-division head', isActive: true },

        // POLICE DEPARTMENT - Mid Ranks
        { code: 'INSP', name: 'Inspector', department: 'POLICE', level: 6, description: 'Police station in-charge', isActive: true },
        { code: 'SI', name: 'Sub-Inspector', department: 'POLICE', level: 7, description: 'Independent charge officer', isActive: true },
        { code: 'ASI', name: 'Assistant Sub-Inspector', department: 'POLICE', level: 8, description: 'Investigation officer', isActive: true },
        { code: 'HC', name: 'Head Constable', department: 'POLICE', level: 9, description: 'Team leader', isActive: true },
        { code: 'CONST', name: 'Constable', department: 'POLICE', level: 10, description: 'Base rank officer', isActive: true },

        // ADMIN DEPARTMENT
        { code: 'ADMIN_CHIEF', name: 'Chief Administrative Officer', department: 'ADMIN', level: 1, description: 'Head of administration', isActive: true },
        { code: 'ADMIN_MGR', name: 'Administrative Manager', department: 'ADMIN', level: 3, description: 'Department manager', isActive: true },
        { code: 'ADMIN_OFFICER', name: 'Administrative Officer', department: 'ADMIN', level: 5, description: 'Administrative duties', isActive: true },

        // TECHNICAL DEPARTMENT
        { code: 'TECH_HEAD', name: 'Technical Head', department: 'TECHNICAL', level: 2, description: 'Technology department head', isActive: true },
        { code: 'TECH_LEAD', name: 'Technical Lead', department: 'TECHNICAL', level: 4, description: 'Technical team lead', isActive: true },
        { code: 'TECH_ANALYST', name: 'Technical Analyst', department: 'TECHNICAL', level: 6, description: 'Technical analysis and support', isActive: true },

        // SUPPORT DEPARTMENT
        { code: 'SUPPORT_MGR', name: 'Support Manager', department: 'SUPPORT', level: 3, description: 'Support operations manager', isActive: true },
        { code: 'SUPPORT_OFFICER', name: 'Support Officer', department: 'SUPPORT', level: 6, description: 'Support desk officer', isActive: true },
    ];

    for (const designation of designations) {
        await prisma.designation.upsert({
            where: { code: designation.code },
            update: designation,
            create: designation,
        });
    }

    console.log(`Created ${designations.length} designations`);
}

async function seedVisitTypes() {
    console.log('Seeding Visit Types...');

    const visitTypes = [
        { code: 'ROUTINE_CHECK', name: 'Routine Check', description: 'Regular welfare check visit', defaultDuration: 30, requiresApproval: false, priority: 3, isActive: true },
        { code: 'HEALTH_EMERGENCY', name: 'Health Emergency', description: 'Medical emergency visit', defaultDuration: 45, requiresApproval: false, priority: 1, isActive: true },
        { code: 'WELFARE_CHECK', name: 'Welfare Check', description: 'General welfare and safety check', defaultDuration: 30, requiresApproval: false, priority: 3, isActive: true },
        { code: 'SAFETY_INSPECTION', name: 'Safety Inspection', description: 'Home safety and security inspection', defaultDuration: 45, requiresApproval: true, priority: 2, isActive: true },
        { code: 'FOLLOW_UP', name: 'Follow-up Visit', description: 'Follow-up from previous visit', defaultDuration: 20, requiresApproval: false, priority: 3, isActive: true },
        { code: 'COMPLAINT_RESPONSE', name: 'Complaint Response', description: 'Response to citizen complaint', defaultDuration: 40, requiresApproval: false, priority: 2, isActive: true },
        { code: 'DOCUMENTATION', name: 'Documentation', description: 'Document collection and verification', defaultDuration: 30, requiresApproval: true, priority: 3, isActive: true },
        { code: 'ASSISTANCE_REQUEST', name: 'Assistance Request', description: 'General assistance request', defaultDuration: 30, requiresApproval: false, priority: 3, isActive: true },
        { code: 'MONTHLY_REVIEW', name: 'Monthly Review', description: 'Monthly progress review visit', defaultDuration: 60, requiresApproval: true, priority: 4, isActive: true },
    ];

    for (const visitType of visitTypes) {
        await prisma.visitType.upsert({
            where: { code: visitType.code },
            update: visitType,
            create: visitType,
        });
    }

    console.log(`Created ${visitTypes.length} visit types`);
}

async function seedHealthConditions() {
    console.log('Seeding Health Conditions...');

    const healthConditions = [
        // Critical Conditions
        { code: 'HEART_DISEASE', name: 'Heart Disease', description: 'Cardiovascular conditions including coronary artery disease', severity: 'CRITICAL', requiresSpecialCare: true, isActive: true },
        { code: 'STROKE', name: 'Stroke', description: 'Cerebrovascular accident or stroke history', severity: 'CRITICAL', requiresSpecialCare: true, isActive: true },
        { code: 'KIDNEY_FAILURE', name: 'Kidney Failure', description: 'Chronic kidney disease or failure', severity: 'CRITICAL', requiresSpecialCare: true, isActive: true },

        // High Severity
        { code: 'DIABETES', name: 'Diabetes Mellitus', description: 'Type 1 or Type 2 diabetes', severity: 'HIGH', requiresSpecialCare: true, isActive: true },
        { code: 'HYPERTENSION', name: 'Hypertension', description: 'High blood pressure', severity: 'HIGH', requiresSpecialCare: true, isActive: true },
        { code: 'COPD', name: 'COPD', description: 'Chronic obstructive pulmonary disease', severity: 'HIGH', requiresSpecialCare: true, isActive: true },
        { code: 'CANCER', name: 'Cancer', description: 'Any form of cancer', severity: 'CRITICAL', requiresSpecialCare: true, isActive: true },
        { code: 'DEMENTIA', name: 'Dementia', description: 'Alzheimers or other forms of dementia', severity: 'HIGH', requiresSpecialCare: true, isActive: true },

        // Medium Severity
        { code: 'ARTHRITIS', name: 'Arthritis', description: 'Rheumatoid or osteoarthritis', severity: 'MEDIUM', requiresSpecialCare: false, isActive: true },
        { code: 'OSTEOPOROSIS', name: 'Osteoporosis', description: 'Bone density loss', severity: 'MEDIUM', requiresSpecialCare: false, isActive: true },
        { code: 'ASTHMA', name: 'Asthma', description: 'Chronic respiratory condition', severity: 'MEDIUM', requiresSpecialCare: true, isActive: true },
        { code: 'DEPRESSION', name: 'Depression', description: 'Clinical depression', severity: 'MEDIUM', requiresSpecialCare: true, isActive: true },
        { code: 'ANXIETY', name: 'Anxiety Disorder', description: 'Chronic anxiety disorders', severity: 'MEDIUM', requiresSpecialCare: false, isActive: true },

        // Low Severity
        { code: 'VISION_LOSS', name: 'Vision Loss', description: 'Partial or complete vision impairment', severity: 'MEDIUM', requiresSpecialCare: false, isActive: true },
        { code: 'HEARING_LOSS', name: 'Hearing Loss', description: 'Partial or complete hearing impairment', severity: 'LOW', requiresSpecialCare: false, isActive: true },
        { code: 'MOBILITY_ISSUES', name: 'Mobility Issues', description: 'Difficulty walking or moving', severity: 'MEDIUM', requiresSpecialCare: false, isActive: true },
        { code: 'THYROID', name: 'Thyroid Disorder', description: 'Hyper or hypothyroidism', severity: 'LOW', requiresSpecialCare: false, isActive: true },
    ];

    for (const condition of healthConditions) {
        await prisma.healthCondition.upsert({
            where: { code: condition.code },
            update: condition,
            create: condition,
        });
    }

    console.log(`Created ${healthConditions.length} health conditions`);
}

async function seedLivingArrangements() {
    console.log('Seeding Living Arrangements...');

    const arrangements = [
        { code: 'ALONE', name: 'Living Alone', description: 'Senior citizen living alone without any family support', requiresCaretaker: false, riskLevel: 'HIGH', isActive: true },
        { code: 'WITH_SPOUSE', name: 'With Spouse', description: 'Living with spouse only', requiresCaretaker: false, riskLevel: 'MEDIUM', isActive: true },
        { code: 'WITH_CHILDREN', name: 'With Children', description: 'Living with children and family', requiresCaretaker: false, riskLevel: 'LOW', isActive: true },
        { code: 'WITH_FAMILY', name: 'With Extended Family', description: 'Living with extended family members', requiresCaretaker: false, riskLevel: 'LOW', isActive: true },
        { code: 'WITH_CARETAKER', name: 'With Caretaker', description: 'Requires and has full-time caretaker', requiresCaretaker: true, riskLevel: 'MEDIUM', isActive: true },
        { code: 'SENIOR_HOME', name: 'In Senior Care Home', description: 'Residing in senior citizen care facility', requiresCaretaker: false, riskLevel: 'LOW', isActive: true },
        { code: 'OLD_AGE_HOME', name: 'In Old Age Home', description: 'Living in old age home', requiresCaretaker: false, riskLevel: 'MEDIUM', isActive: true },
        { code: 'WITH_RELATIVES', name: 'With Other Relatives', description: 'Living with relatives (not immediate family)', requiresCaretaker: false, riskLevel: 'MEDIUM', isActive: true },
    ];

    for (const arrangement of arrangements) {
        await prisma.livingArrangement.upsert({
            where: { code: arrangement.code },
            update: arrangement,
            create: arrangement,
        });
    }
    console.log(`Created ${arrangements.length} living arrangements`);
}

async function seedMaritalStatuses() {
    console.log('Seeding Marital Statuses...');

    const statuses = [
        { code: 'MS001', name: 'Married', description: 'Currently married', isActive: true },
        { code: 'MS002', name: 'Widowed', description: 'Spouse is deceased', isActive: true },
        { code: 'MS003', name: 'Divorced', description: 'Legally divorced', isActive: true },
        { code: 'MS004', name: 'Separated', description: 'Living separately', isActive: true },
        { code: 'MS005', name: 'Single', description: 'Never married', isActive: true },
    ];

    for (const status of statuses) {
        await prisma.maritalStatus.upsert({
            where: { code: status.code },
            update: status,
            create: status,
        });
    }

    console.log(`Created ${statuses.length} marital statuses`);
}

async function seedRiskFactors() {
    console.log('Seeding Risk Factors...');

    const factors = [
        // Living Situation
        { code: 'RF001', name: 'Living Alone', description: 'Senior citizen lives alone', weight: 8, category: 'LIVING', isActive: true },
        { code: 'RF002', name: 'Isolated Area', description: 'Resides in isolated/remote area', weight: 6, category: 'LIVING', isActive: true },

        // Health
        { code: 'RF003', name: 'Bedridden', description: 'Completely bedridden', weight: 9, category: 'HEALTH', isActive: true },
        { code: 'RF004', name: 'Dementia/Alzheimers', description: 'Cognitive impairment', weight: 9, category: 'HEALTH', isActive: true },
        { code: 'RF005', name: 'Mobility Issues', description: 'Difficulty moving around', weight: 5, category: 'HEALTH', isActive: true },

        // Social
        { code: 'RF006', name: 'No Local Family', description: 'No immediate family in city', weight: 7, category: 'SOCIAL', isActive: true },
        { code: 'RF007', name: 'Previous Victim', description: 'History of being victimized', weight: 8, category: 'SOCIAL', isActive: true },

        // Economic
        { code: 'RF008', name: 'Financial Distress', description: 'Severe financial constraints', weight: 4, category: 'ECONOMIC', isActive: true },
    ];

    for (const factor of factors) {
        await prisma.riskFactor.upsert({
            where: { code: factor.code },
            update: factor,
            create: factor,
        });
    }

    console.log(`Created ${factors.length} risk factors`);
}

async function main() {
    console.log('Starting master data seeding...\n');

    try {
        await seedRoles();
        await seedRanges();
        await seedDistricts();
        await seedSubDivisions();
        await seedPoliceStations();
        await seedDesignations();
        await seedVisitTypes();
        await seedHealthConditions();
        await seedLivingArrangements();
        await seedMaritalStatuses();
        await seedRiskFactors();

        console.log('\nMaster data seeding completed successfully!');
    } catch (error) {
        console.log('Error seeding data:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
