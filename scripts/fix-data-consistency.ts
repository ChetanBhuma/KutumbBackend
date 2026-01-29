
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const formatMobile = (mobile: string) => {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');
    // If 10 digits, add +91
    if (digits.length === 10) return `+91${digits}`;
    // If 12 digits (91...), add +
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    // Return original if unknown
    return mobile;
};

async function fixConsistency() {
    console.log('🛠️ Starting Data Repair...');

    // 1. Fix Mobile Numbers (Auth)
    const auths = await prisma.citizenAuth.findMany();
    let fixedAuth = 0;
    for (const auth of auths) {
        const formatted = formatMobile(auth.mobileNumber);
        if (formatted !== auth.mobileNumber) {
            try {
                await prisma.citizenAuth.update({
                    where: { id: auth.id },
                    data: { mobileNumber: formatted }
                });
                fixedAuth++;
            } catch (e) {
                console.log(`Failed to update Auth ${auth.mobileNumber}: Duplicate?`);
            }
        }
    }
    console.log(`Fixed ${fixedAuth} Auth mobile numbers.`);

    // 2. Fix Mobile Numbers (Registration)
    const regs = await prisma.citizenRegistration.findMany();
    let fixedReg = 0;
    for (const reg of regs) {
        const formatted = formatMobile(reg.mobileNumber);
        if (formatted !== reg.mobileNumber) {
            try {
                await prisma.citizenRegistration.update({
                    where: { id: reg.id },
                    data: { mobileNumber: formatted }
                });
                fixedReg++;
            } catch (e) {
                console.log(`Failed to update Reg ${reg.mobileNumber}: Duplicate?`);
            }
        }
    }
    console.log(`Fixed ${fixedReg} Registration mobile numbers.`);

    // 3. Fix Mobile Numbers (SeniorCitizen)
    const citizens = await prisma.seniorCitizen.findMany();
    let fixedCit = 0;
    for (const citizen of citizens) {
        const formatted = formatMobile(citizen.mobileNumber);
        if (formatted !== citizen.mobileNumber) {
            try {
                await prisma.seniorCitizen.update({
                    where: { id: citizen.id },
                    data: { mobileNumber: formatted }
                });
                fixedCit++;
            } catch (e) {
                console.log(`Failed to update Citizen ${citizen.mobileNumber}: Duplicate?`);
            }
        }
    }
    console.log(`Fixed ${fixedCit} Citizen mobile numbers.`);

    // 4. Link Orphaned Auth & Sync Status
    const allCitizens = await prisma.seniorCitizen.findMany();
    let linked = 0;
    let synced = 0;

    for (const citizen of allCitizens) {
        // Link Auth
        const auth = await prisma.citizenAuth.findFirst({
            where: { mobileNumber: citizen.mobileNumber, citizenId: null }
        });
        if (auth) {
            await prisma.citizenAuth.update({
                where: { id: auth.id },
                data: { citizenId: citizen.id }
            });
            linked++;
        }

        // Sync Registration Status
        let targetStatus = 'PENDING_REVIEW';
        if (citizen.idVerificationStatus === 'Verified') targetStatus = 'APPROVED';
        else if (citizen.idVerificationStatus === 'Rejected') targetStatus = 'REJECTED';

        // If citizen is verified, force registration to Approved
        if (targetStatus === 'APPROVED') {
            const res = await prisma.citizenRegistration.updateMany({
                where: {
                    citizenId: citizen.id,
                    status: { not: 'APPROVED' }
                },
                data: { status: 'APPROVED' }
            });
            synced += res.count;
        }
    }
    console.log(`Linked ${linked} orphaned auth records.`);
    console.log(`Synced ${synced} registration statuses.`);

    console.log('\n✅ Data Repair Complete.');
}

fixConsistency()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
