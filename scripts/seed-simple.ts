import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test admin user...');
  const hash = await bcrypt.hash('Admin@123', 10);
  
  try {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@delhipolice.gov.in',
        phone: '9876543210',
        passwordHash: hash,
        legacyRole: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    
    console.log('✅ Created admin:', admin.email);
    console.log('📧 Email: admin@delhipolice.gov.in');
    console.log('🔑 Password: Admin@123');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Admin user already exists');
    } else {
      throw error;
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
