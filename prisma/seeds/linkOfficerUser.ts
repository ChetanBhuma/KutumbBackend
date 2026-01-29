import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function linkOfficerUser() {
    console.log('🔗 Creating/linking User for officer-1...');

    const defaultPassword = 'Admin@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Find officer-1
    const officer1 = await prisma.beatOfficer.findUnique({
        where: { id: 'officer-1' }
    }) as any;

    if (!officer1) {
        console.error('officer-1 not found');
        return;
    }

    // 2. Create or update user for this officer
    // Use a unique phone since officer's phone might conflict with demo users
    const uniquePhone = '98765' + officer1.id.slice(0, 5);
    const user = await prisma.user.upsert({
        where: { email: officer1.email },
        update: {
            passwordHash,
            officerId: officer1.id,
            isActive: true
        },
        create: {
            email: officer1.email,
            phone: uniquePhone,
            passwordHash,
            role: 'OFFICER',
            officerId: officer1.id,
            isActive: true
        }
    });

    console.log(`✅ User created/updated for officer-1: ${user.email}`);
}

linkOfficerUser()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
