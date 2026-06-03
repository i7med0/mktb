"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getEmployeeHistory() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "EMPLOYEE") throw new Error("Unauthorized");
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const works = await prisma.employeeWork.findMany({
    where: { 
      employeeId: session.user.id,
      createdAt: { gte: thirtyDaysAgo }
    },
    include: { 
      dailyRecord: {
        select: { date: true, officeId: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalOrdersLast30Days = works.reduce((acc, work) => acc + work.ordersCount, 0);
  const totalUnpaid = works.filter(w => w.paymentStatus === 'UNPAID').reduce((acc, work) => acc + work.ordersCount, 0);
  const totalPaid = works.filter(w => w.paymentStatus === 'PAID').reduce((acc, work) => acc + work.ordersCount, 0);

  return { works, stats: { totalOrdersLast30Days, totalUnpaid, totalPaid } };
}
