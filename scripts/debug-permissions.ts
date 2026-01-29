
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging Permissions...');

  const categories = await prisma.permissionCategory.findMany({
    include: {
      permissions: {
        orderBy: { displayOrder: 'asc' }
      }
    },
    orderBy: { displayOrder: 'asc' }
  });

  console.log(`Found ${categories.length} categories.`);

  categories.forEach(cat => {
    console.log(`\n[${cat.name}] (${cat.code})`);
    cat.permissions.forEach(p => {
      console.log(` - ${p.code} (${p.name}) [isActive: ${p.isActive}]`);
    });
  });

  // Check for orphan permissions
  const orphans = await prisma.permission.findMany({
    where: { categoryId: null }
  });

  if (orphans.length > 0) {
    console.log('\n⚠️ ORPHAN PERMISSIONS (No Category):');
    orphans.forEach(p => console.log(` - ${p.code}`));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
