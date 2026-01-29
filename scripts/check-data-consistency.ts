
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConsistency() {
    console.log('🔍 Starting Data Consistency Check...');

    // 1. Check for Orphaned Auth (Auth exists, but no Citizen linked)
    const orphanedAuth = await prisma.citizenAuth.findMany({
        where: { citizenId: null }
    });
    console.log(`\n[Auth] Orphaned Records (No Citizen Linked): ${orphanedAuth.length}`);
    if (orphanedAuth.length > 0) {
        orphanedAuth.forEach(a => console.log(` - Mobile: ${a.mobileNumber}`));
    }

    // 2. Check for Registrations that are COMPLETED but have no Citizen
    const stuckRegistrations = await prisma.citizenRegistration.findMany({
        where: {
            status: 'COMPLETED',
            citizenId: null
        }
    });
    console.log(`\n[Registration] Completed but No Profile: ${stuckRegistrations.length}`);
    stuckRegistrations.forEach(r => console.log(` - Mobile: ${r.mobileNumber}`));

    // 3. Status Mismatch (Registration says APPROVED, but Citizen is Pending or not Verified)
    const approvedRegistrations = await prisma.citizenRegistration.findMany({
        where: { status: 'APPROVED' },
        include: { citizen: true }
    });

    let mismatchCount = 0;
    console.log(`\n[Status] Mismatch Check (Registration APPROVED vs Citizen Status):`);
    approvedRegistrations.forEach(r => {
        if (!r.citizen) {
            console.log(` - CRITICAL: Registration ${r.mobileNumber} is APPROVED but has NO Citizen profile!`);
            mismatchCount++;
        } else {
            if (r.citizen.idVerificationStatus !== 'Verified') {
                console.log(` - WARN: Registration ${r.mobileNumber} APPROVED, but Citizen Verification is '${r.citizen.idVerificationStatus}'`);
                mismatchCount++;
            }
        }
    });
    if (mismatchCount === 0) console.log(" - No status mismatches found.");

    // 4. Mobile Mismatch (Auth Mobile != Citizen Mobile)
    // This requires joining.
    const auths = await prisma.citizenAuth.findMany({
        include: { citizen: true }
    });

    let mobileMismatch = 0;
    console.log(`\n[Data] Mobile Number Sychronization Check:`);
    auths.forEach(a => {
        if (a.citizen && a.mobileNumber !== a.citizen.mobileNumber) {
            console.log(` - ERROR: Auth Mobile (${a.mobileNumber}) != Profile Mobile (${a.citizen.mobileNumber})`);
            mobileMismatch++;
        }
    });
    if (mobileMismatch === 0) console.log(" - All linked mobiles match.");

    console.log('\n✅ Consistency Check Complete.');
}

checkConsistency()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
