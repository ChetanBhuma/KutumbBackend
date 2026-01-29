
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOfficers() {
    const count = await prisma.beatOfficer.count();
    console.log(`Total Beat Officers: ${count}`);

    if (count === 0) {
        console.log("No officers found. Creating test officers...");
        // Fetch jurisdiction data
        const range = await prisma.range.findFirst();
        const district = await prisma.district.findFirst({ where: { rangeId: range?.id } });
        const subDivision = await prisma.subDivision.findFirst({ where: { districtId: district?.id } });
        const ps = await prisma.policeStation.findFirst({ where: { subDivisionId: subDivision?.id } });

        if (!range || !district || !subDivision || !ps) {
            console.error("Missing hierarchy data. Seed master data first.");
            return;
        }

        // Create ACP (SubDivision Level)
        await prisma.beatOfficer.create({
            data: {
                name: 'Test ACP',
                rank: 'ACP',
                badgeNumber: 'ACP001',
                mobileNumber: '9999999001',
                subDivisionId: subDivision.id,
                policeStationId: ps.id, // Usually ACP sits at a PS or HQ, but jurisdiction is SubDiv
                // For logic test, we rely on subDivisionId
            }
        });

        // Create SHO (Station Level) - In same SubDiv
        await prisma.beatOfficer.create({
             data: {
                name: 'Test SHO',
                rank: 'SHO',
                badgeNumber: 'SHO001',
                mobileNumber: '9999999002',
                subDivisionId: subDivision.id,
                policeStationId: ps.id
            }
        });

        // Create Constable (Beat Level) - In same PS
        // Need a beat
        let beat = await prisma.beat.findFirst({ where: { policeStationId: ps.id } });
        if (!beat) {
            beat = await prisma.beat.create({
                data: {
                    name: 'Beat 1',
                    code: 'BT1',
                    policeStationId: ps.id
                }
            });
        }

        await prisma.beatOfficer.create({
            data: {
               name: 'Test Constable',
               rank: 'Constable',
               badgeNumber: 'CONST001',
               mobileNumber: '9999999003',
               subDivisionId: subDivision.id,
               policeStationId: ps.id,
               beatId: beat.id
           }
       });

       console.log("Created test officers.");
    }
}

checkOfficers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
