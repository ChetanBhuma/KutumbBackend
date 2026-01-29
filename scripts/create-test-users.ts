import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../src/services/passwordService'; // Adjust path
import { Role } from '../src/types/auth';

const prisma = new PrismaClient();

const USERS = [
    { role: Role.SUPER_ADMIN, email: 'superadmin@delhipolice.gov.in', name: 'Super Admin' },
    { role: Role.ADMIN, email: 'admin@delhipolice.gov.in', name: 'System Administrator' },
    { role: Role.OFFICER, email: 'officer@delhipolice.gov.in', name: 'Officer Vikram' },
    { role: Role.SUPERVISOR, email: 'supervisor@delhipolice.gov.in', name: 'Supervisor Amit' },
    { role: Role.CONTROL_ROOM, email: 'controlroom@delhipolice.gov.in', name: 'Control Room Ops' },
    { role: Role.DATA_ENTRY, email: 'dataentry@delhipolice.gov.in', name: 'Data Entry Clerk' },
    { role: Role.VIEWER, email: 'viewer@delhipolice.gov.in', name: 'Audit Viewer' },
    // Citizen is usually created via mobile, but we can seed one.
    { role: Role.CITIZEN, email: 'citizen@gmail.com', name: 'Ramesh Citizen' },
];

const DEFAULT_PASS = 'Test@123';

async function main() {
    console.log('🚀 Seeding Test Users for All Roles...');

    const hashedPass = await PasswordService.hash(DEFAULT_PASS);

    for (const u of USERS) {
        // Upsert User
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                role: u.role,
                isActive: true,
                passwordHash: hashedPass
            },
            create: {
                email: u.email,
                phone: `999999${Math.floor(1000 + Math.random() * 9000)}`, // Random dummy phone
                role: u.role,
                isActive: true,
                passwordHash: hashedPass
            }
        });

        // If it's an officer role, ensure BeatOfficer link exists (basic)
        if (u.role === Role.OFFICER && !user.officerId) {
            // Try to find an unlinked officer or create one
            // For simplicity in this test script, we might skip full profile creation 
            // unless necessary. But let's create a minimal one if needed
            // console.log('   - Linked to Officer Profile');
        }

        console.log(`✅ ${u.role}: ${u.email} / ${DEFAULT_PASS}`);
    }

    console.log('\n✨ Database Updated. You can login with these credentials.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
