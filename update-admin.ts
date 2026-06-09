import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('moeadmin', 10);
  
  // Find super admin
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });
    console.log('Admin password updated to moeadmin');
  } else {
    console.log('No super admin found');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
