import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBadgeNumbers() {
  console.log('Starting badge number update...');

  try {
    const officers = await prisma.beatOfficer.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Found ${officers.length} officers to update.`);

    let currentBadgeNumber = 10000000;

    for (const officer of officers) {
      const newBadgeNumber = currentBadgeNumber.toString();

      console.log(`Updating officer ${officer.name} (${officer.id}) - Old Badge: ${officer.badgeNumber} -> New Badge: ${newBadgeNumber}`);

      await prisma.beatOfficer.update({
        where: { id: officer.id },
        data: { badgeNumber: newBadgeNumber },
      });

      currentBadgeNumber++;
    }

    console.log('All officers updated successfully.');
  } catch (error) {
    console.error('Error updating badge numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBadgeNumbers();
