import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkLatestUser() {
    // Find the latest user with an officer profile
    const user = await prisma.user.findFirst({
        where: {
            officerProfile: {
                isNot: null
            }
        },
        orderBy: { createdAt: 'desc' },
        include: {
            officerProfile: {
                include: {
                    Range: true,
                    District: true,
                    SubDivision: true,
                    PoliceStation: true,
                    Beat: true
                }
            }
        }
    });

    if (!user) {
        console.log('No officer user found.');
        return;
    }

    console.log('--- Latest Officer User ---');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);

    if (user.officerProfile) {
        console.log('\n--- Officer Details ---');
        console.log('Name:', user.officerProfile.name);
        console.log('Badge/PIS:', user.officerProfile.badgeNumber);
        console.log('Rank:', user.officerProfile.rank);

        console.log('\n--- Jurisdiction ---');
        console.log('Range:', user.officerProfile.Range?.name || 'None');
        console.log('District:', user.officerProfile.District?.name || 'None');
        console.log('SubDiv:', user.officerProfile.SubDivision?.name || 'None');
        console.log('Station:', user.officerProfile.PoliceStation?.name || 'None');
        console.log('Beat:', user.officerProfile.Beat?.name || 'None');
    } else {
        console.log('Officer Profile is NULL (Unexpected for this query)');
    }
}

checkLatestUser().catch(console.error).finally(() => prisma.$disconnect());
