"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getEmployeeHistory() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "EMPLOYEE") throw new Error("Unauthorized");
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // سجل آخر 30 يوم
  const works = await prisma.employeeWork.findMany({
    where: { 
      employeeId: session.user.id,
      createdAt: { gte: thirtyDaysAgo }
    },
    include: { 
      dailyRecord: { select: { date: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // إحصائيات الشهر الحالي فقط
  const monthlyWorks = await prisma.employeeWork.findMany({
    where: {
      employeeId: session.user.id,
      dailyRecord: { date: { gte: startOfMonth, lte: endOfMonth } }
    },
    include: { dailyRecord: { select: { date: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const totalOrdersLast30Days = works.reduce((acc, work) => acc + work.ordersCount, 0);
  const totalUnpaid = works.filter(w => w.paymentStatus === 'UNPAID').reduce((acc, work) => acc + work.ordersCount, 0);
  const totalPaid = works.filter(w => w.paymentStatus === 'PAID').reduce((acc, work) => acc + work.ordersCount, 0);

  // إحصائيات الشهر الحالي
  const monthlyTotal = monthlyWorks.reduce((acc, w) => acc + w.ordersCount, 0);
  const monthlyPaid = monthlyWorks.filter(w => w.paymentStatus === 'PAID').reduce((acc, w) => acc + w.ordersCount, 0);
  const monthlyUnpaid = monthlyWorks.filter(w => w.paymentStatus === 'UNPAID').reduce((acc, w) => acc + w.ordersCount, 0);

  return {
    works,
    monthlyWorks,
    stats: { totalOrdersLast30Days, totalUnpaid, totalPaid },
    monthlyStats: { monthlyTotal, monthlyPaid, monthlyUnpaid }
  };
}
