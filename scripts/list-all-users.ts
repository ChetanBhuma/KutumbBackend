import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function listAllUsers() {
    console.log('📋 Listing all users in database...\\n');

    try {
        // Get all users
        const users = await prisma.user.findMany({
            orderBy: { role: 'asc' }
        });

        console.log(`Total Users: ${users.length}\\n`);

        // Group by role
        const byRole: Record<string, any[]> = {};
        users.forEach(user => {
            if (!byRole[user.role]) {
                byRole[user.role] = [];
            }
            byRole[user.role].push(user);
        });

        // Display by role
        for (const [role, roleUsers] of Object.entries(byRole)) {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`${role}s (${roleUsers.length})`);
            console.log(`${'='.repeat(50)}`);

            for (const user of roleUsers) {
                console.log(`\\n  ✓ Email: ${user.email}`);
                console.log(`    Phone: ${user.phone}`);
                console.log(`    Active: ${user.isActive}`);

                // Get officer profile if exists
                if (user.officerId) {
                    const officer = await prisma.beatOfficer.findUnique({
                        where: { id: user.officerId }
                    });
                    if (officer) {
                        console.log(`    Name: ${officer.name}`);
                        console.log(`    PIS/Badge: ${officer.badgeNumber || 'N/A'}`);
                        console.log(`    Rank: ${officer.rank}`);
                    }
                }
            }
        }

        console.log(`\\n${'='.repeat(50)}\\n`);

    } catch (error) {
        console.error('❌ Error listing users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

listAllUsers()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
