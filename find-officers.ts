
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find users with role containing 'OFFICER' (case insensitive if possible, but let's try exact matches first)
  // Common roles: OFFICER, ADMIN, BEAT_OFFICER
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['OFFICER', 'ADMIN', 'BEAT_OFFICER']
      }
    },
    take: 5,
    select: {
      email: true,
      phone: true,
      role: true,
      // We can't show password hash, but knowing they exist is enough.
      // Usually dev passwords are 'password' or 'admin123'
    }
  });

  console.log('Found Officers/Admins:', JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
