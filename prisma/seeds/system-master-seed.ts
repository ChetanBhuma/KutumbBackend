
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const masters = {
    GENDER: ['Male', 'Female', 'Other'],
    RELIGION: ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Other'],
    OCCUPATION: ['Retired', 'Service', 'Business', 'Homemaker', 'Other'],
    BLOOD_GROUP: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    RELATION: ['Son', 'Daughter', 'Relative', 'Neighbor', 'Friend', 'Other'],
    MOBILITY: [
        { code: 'None', name: 'None (Can walk independently)' },
        { code: 'Walker', name: 'Uses Walker/Stick' },
        { code: 'Wheelchair', name: 'Wheelchair Bound' },
        { code: 'Bedridden', name: 'Bedridden' }
    ],
    SERVICE_TYPE: ['Legal Aid', 'Health Checkups', 'Social Gatherings', 'Digital Literacy', 'Safety Audits', 'Counseling'],
    LIVING_ARRANGEMENT_OPTIONS: [
        { code: 'Alone', name: 'Living Alone' },
        { code: 'Spouse', name: 'Living with Spouse' },
        { code: 'Family', name: 'Living with Family (Children/Relatives)' }
    ]
};

async function main() {
    console.log('Seeding System Masters...');

    for (const [type, values] of Object.entries(masters)) {
        console.log(`Processing ${type}...`);
        let order = 1;
        for (const item of values) {
            let code = '';
            let name = '';

            if (typeof item === 'string') {
                name = item;
                code = item.toUpperCase().replace(/\s+/g, '_');
                // Special case for 'Service' in Occupation to avoid conflict or confusion, but consistent code is fine
            } else {
                code = item.code;
                name = item.name;
            }

            await prisma.systemMaster.upsert({
                where: {
                    type_code: {
                        type,
                        code
                    }
                },
                update: {
                    name,
                    order: order++,
                    isActive: true
                },
                create: {
                    type,
                    code,
                    name,
                    order: order++,
                    isActive: true
                }
            });
        }
    }
    console.log('System Masters seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
