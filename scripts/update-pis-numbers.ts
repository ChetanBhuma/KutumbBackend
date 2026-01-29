import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePISNumbers() {
    console.log('🔄 Updating PIS Numbers to real values...\\n');

    try {
        // Update Officer 1: DL001234 → 28120039
        const officer1 = await prisma.beatOfficer.findFirst({
            where: { mobileNumber: '9876543220' }
        });

        if (officer1) {
            await prisma.beatOfficer.update({
                where: { id: officer1.id },
                data: { badgeNumber: '28120039' }
            });
            console.log(`✅ Officer 1 (${officer1.name}): DL001234 → 28120039`);
        }

        // Update Officer 2: DL001235 → 28911777
        const officer2 = await prisma.beatOfficer.findFirst({
            where: { mobileNumber: '9876543221' }
        });

        if (officer2) {
            await prisma.beatOfficer.update({
                where: { id: officer2.id },
                data: { badgeNumber: '28911777' }
            });
            console.log(`✅ Officer 2 (${officer2.name}): DL001235 → 28911777`);
        }

        console.log('\\n🎉 PIS Numbers updated successfully!');
        console.log('\\n📝 Updated Credentials:');
        console.log('   Officer 1: PIS 28120039 (Constable Rajesh Kumar)');
        console.log('   Officer 2: PIS 28911777 (Head Constable Priya Sharma)');

    } catch (error) {
        console.error('❌ Error updating PIS numbers:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updatePISNumbers()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
