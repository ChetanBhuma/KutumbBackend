
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for duplicate Citizens by Mobile Number...');

    const citizens = await prisma.seniorCitizen.findMany({
        select: {
            id: true,
            fullName: true,
            mobileNumber: true,
            createdAt: true
        }
    });

    const mobileMap = new Map<string, any[]>();
    citizens.forEach(c => {
        if (!c.mobileNumber) return;
        if (!mobileMap.has(c.mobileNumber)) {
            mobileMap.set(c.mobileNumber, []);
        }
        mobileMap.get(c.mobileNumber)?.push(c);
    });

    let dupCount = 0;
    for (const [mobile, list] of mobileMap.entries()) {
        if (list.length > 1) {
            console.log(`\n⚠️  Duplicate Mobile: ${mobile} (${list.length} records)`);
            list.forEach(c => {
                console.log(`   - ID: ${c.id}, Name: ${c.fullName}, Created: ${c.createdAt.toISOString()}`);
            });
            dupCount++;
        }
    }

    if (dupCount === 0) {
        console.log('✅ No duplicate citizens found by mobile number.');
    }

    console.log('\n🔍 Checking for Duplicate Nested Records (Family/Emergency)...');
    // Check nested duplicates for the most recently created citizen (likely the user)
    // We'll just check all citizens with relations

    const citizensWithRelations = await prisma.seniorCitizen.findMany({
        include: {
            FamilyMember: true,
            EmergencyContact: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5 // Check last 5 active users
    });

    citizensWithRelations.forEach(c => {
        console.log(`\n👤 Citizen: ${c.fullName} (${c.id})`);

        // Check Emergency Contacts
        const ecNames = c.EmergencyContact.map(e => `${e.name}|${e.mobileNumber}`);
        const uniqueEc = new Set(ecNames);
        if (ecNames.length > uniqueEc.size) {
            console.log(`   ❌ Duplicate Emergency Contacts found: ${ecNames.length} total, ${uniqueEc.size} unique`);
            c.EmergencyContact.forEach(e => console.log(`      - ${e.name} (${e.mobileNumber}) [${e.id}]`));
        } else {
            console.log(`   ✅ Emergency Contacts: ${c.EmergencyContact.length}`);
        }

        // Check Family Members
        const fmNames = c.FamilyMember.map(f => `${f.name}|${f.relation}`);
        const uniqueFm = new Set(fmNames);
        if (fmNames.length > uniqueFm.size) {
            console.log(`   ❌ Duplicate Family Members found: ${fmNames.length} total, ${uniqueFm.size} unique`);
            c.FamilyMember.forEach(f => console.log(`      - ${f.name} (${f.relation}) [${f.id}]`));
        } else {
            console.log(`   ✅ Family Members: ${c.FamilyMember.length}`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
