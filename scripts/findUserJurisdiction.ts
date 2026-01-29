import prisma from '../src/config/prisma';

async function findUser() {
    const email = 'test.acp.1767600008750@delhipolice.gov.in';
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            officerProfile: {
                include: {
                    SubDivision: true,
                    District: true,
                    Range: true,
                    PoliceStation: true,
                    Beat: true
                }
            }
        }
    });

    if (user) {
        console.log('User Found:', user.email);
        if (user.officerProfile) {
            console.log('Officer Profile Found');
            console.log('Role/Rank:', user.officerProfile.rank);
            console.log('SubDivision:', user.officerProfile.SubDivision?.name);
            console.log('District:', user.officerProfile.District?.name);
            console.log('Range:', user.officerProfile.Range?.name);
            console.log('PoliceStation:', user.officerProfile.PoliceStation?.name);
        } else {
            console.log('No Officer Profile linked.');
        }
    } else {
        console.log('User not found');
    }
}

findUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
