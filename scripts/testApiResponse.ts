import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testResponse() {
    // Mimic the query in userController.ts listUsers
    const users = await prisma.user.findMany({
        where: {
             officerProfile: { isNot: null }
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
            SeniorCitizen: {
                select: {
                    id: true,
                    fullName: true,
                    mobileNumber: true,
                    permanentAddress: true,
                    vulnerabilityLevel: true,
                }
            },
            officerProfile: {
                select: {
                    id: true,
                    rank: true,
                    name: true,
                    badgeNumber: true,
                    SubDivision: { select: { id: true, name: true } },
                    District: { select: { id: true, name: true } },
                    Range: { select: { id: true, name: true } },
                    PoliceStation: { select: { id: true, name: true } },
                    Beat: { select: { id: true, name: true } },
                }
            }
        }
    });

    if (users.length === 0) {
        console.log('No users found');
        return;
    }

    const user = users[0];
    // Mimic the cleanup transform
    const { passwordHash, ...safeUser } = user;

    // Check what safeUser.officerProfile looks like
    console.log('--- Transform Result ---');
    console.log(JSON.stringify(safeUser.officerProfile, null, 2));

    if (!safeUser.officerProfile?.name) {
        console.error('ERROR: Name is missing in object!');
    } else {
        console.log('SUCCESS: Name is present:', safeUser.officerProfile.name);
    }
}

testResponse().catch(console.error).finally(() => prisma.$disconnect());
