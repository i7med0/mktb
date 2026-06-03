import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // حساب الأدمن الرئيسي
  const hashedAdminPassword = await bcrypt.hash('admin123', 10)
  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'مدير النظام',
      username: 'admin',
      password: hashedAdminPassword,
      role: 'SUPER_ADMIN',
    },
  })

  // حساب مكتب تجريبي (مسموح له فقط من IP معين، يمكن جعله * للكل الآن)
  const hashedOfficePassword = await bcrypt.hash('office123', 10)
  const office = await prisma.user.upsert({
    where: { username: 'office1' },
    update: {},
    create: {
      name: 'المكتب الرئيسي',
      username: 'office1',
      password: hashedOfficePassword,
      role: 'OFFICE',
      allowedIps: ['*'], // * تعني مسموح من أي شبكة للتمكن من اختباره محلياً
    },
  })

  // حساب موظف تجريبي تابع للمكتب
  const hashedEmployeePassword = await bcrypt.hash('emp123', 10)
  const employee = await prisma.user.upsert({
    where: { username: 'employee1' },
    update: {},
    create: {
      name: 'أحمد الموظف',
      username: 'employee1',
      password: hashedEmployeePassword,
      role: 'EMPLOYEE',
      officeId: office.id,
    },
  })

  console.log('✅ تم إضافة الحسابات التجريبية بنجاح!')
  console.log({ superAdmin: superAdmin.username, office: office.username, employee: employee.username })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
