import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const officer = await prisma.officer.findFirst({
    where: { badgeNumber: '10000004' },
    include: {
      user: {
        include: {
          roleRef: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  console.log('Officer details:');
  console.log('ID:', officer?.id);
  console.log('Name:', officer?.name);
  console.log('Rank:', officer?.rank);
  console.log('Badge:', officer?.badgeNumber);
  console.log('User ID:', officer?.user?.id);
  console.log('User Email:', officer?.user?.email);
  console.log('User Role String:', officer?.user?.role);
  console.log('User roleRef:', officer?.user?.roleRef?.code);
  console.log('User Permissions:', officer?.user?.roleRef?.permissions?.map(p => p.permission.code));

  // Check role OFFICER or BEAT_OFFICER or CONSTABLE
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  console.log('\nAll Roles in DB:');
  for (const r of roles) {
    console.log(`Role: ${r.code} (${r.name}) -> ${r.permissions.length} perms:`, r.permissions.map(p => p.permission.code));
  }

  // Check if permission dashboard.officer.view exists
  const perm = await prisma.permission.findFirst({ where: { code: 'dashboard.officer.view' } });
  console.log('\ndashboard.officer.view permission exists?', perm);
}

main().catch(console.error).finally(() => prisma.$disconnect());
