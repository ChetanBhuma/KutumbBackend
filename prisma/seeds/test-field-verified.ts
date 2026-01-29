import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFieldVerifiedStatus() {
    console.log('Testing FieldVerified status enum...\n');

    try {
        // Test 1: Check if we can query with FieldVerified status
        const citizensWithFieldVerified = await prisma.seniorCitizen.findMany({
            where: {
                idVerificationStatus: 'FieldVerified'
            },
            select: {
                id: true,
                fullName: true,
                idVerificationStatus: true,
                status: true,
                digitalCardIssued: true
            }
        });

        console.log('✅ FieldVerified status is working!');
        console.log(`Found ${citizensWithFieldVerified.length} citizens with FieldVerified status\n`);

        if (citizensWithFieldVerified.length > 0) {
            console.log('Citizens with FieldVerified status:');
            citizensWithFieldVerified.forEach(citizen => {
                console.log(`  - ${citizen.fullName}`);
                console.log(`    ID: ${citizen.id}`);
                console.log(`    Verification Status: ${citizen.idVerificationStatus}`);
                console.log(`    Overall Status: ${citizen.status}`);
                console.log(`    Digital Card Issued: ${citizen.digitalCardIssued}`);
                console.log('');
            });
        }

        // Test 2: Check all possible IdentityStatus values
        console.log('Testing all IdentityStatus values:');
        const statusCounts = await Promise.all([
            prisma.seniorCitizen.count({ where: { idVerificationStatus: 'Pending' } }),
            prisma.seniorCitizen.count({ where: { idVerificationStatus: 'FieldVerified' } }),
            prisma.seniorCitizen.count({ where: { idVerificationStatus: 'Verified' } }),
            prisma.seniorCitizen.count({ where: { idVerificationStatus: 'Rejected' } }),
            prisma.seniorCitizen.count({ where: { idVerificationStatus: 'Suspended' } })
        ]);

        console.log(`  Pending: ${statusCounts[0]}`);
        console.log(`  FieldVerified: ${statusCounts[1]}`);
        console.log(`  Verified: ${statusCounts[2]}`);
        console.log(`  Rejected: ${statusCounts[3]}`);
        console.log(`  Suspended: ${statusCounts[4]}`);
        console.log('');

        console.log('✅ All tests passed! The migration was successful.');

    } catch (error) {
        console.error('❌ Error testing FieldVerified status:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testFieldVerifiedStatus();
