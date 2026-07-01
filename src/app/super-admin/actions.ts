"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { autoCloseStaleSessions } from "@/lib/sessions";
import { logAction } from "@/lib/audit";

export async function getSuperAdminData(month?: string, year?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  
  autoCloseStaleSessions().catch(console.error);

  // If no month/year provided, default to current
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0); // last day of month

  const [offices, globalRecords] = await Promise.all([
    prisma.user.findMany({
      where: { role: "OFFICE" },
      include: {
        sessions: { 
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: 'desc' } 
        }
      }
    }),
    prisma.dailyRecord.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' },
      include: {
        employeeWorks: { include: { employee: true } }
      }
    })
  ]);

  return { offices, globalRecords, targetMonth, targetYear };
}

export async function togglePaymentStatus(workId: string, currentStatus: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const newStatus = currentStatus === "PAID" ? "UNPAID" : "PAID";
  
  await prisma.employeeWork.update({
    where: { id: workId },
    data: { paymentStatus: newStatus }
  });

  await logAction(session.user.id, session.user.name || "", "SUPER_ADMIN", "TOGGLE_PAYMENT", `تغيير حالة الدفع للعمل ${workId} إلى: ${newStatus}`);

  revalidatePath("/super-admin");
}

// إحصائيات مقارنة بين الموظفين
export async function getEmployeeComparisonStats(month?: string, year?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0);

  const [employees, works] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: { id: true, name: true },
    }),
    prisma.employeeWork.findMany({
      where: {
        dailyRecord: { date: { gte: startDate, lte: endDate } },
      },
      select: {
        employeeId: true,
        ordersCount: true,
        paymentStatus: true,
      },
    })
  ]);

  const stats = employees.map((emp) => {
    const empWorks = works.filter((w) => w.employeeId === emp.id);
    const totalOrders = empWorks.reduce((acc, w) => acc + w.ordersCount, 0);
    const paidOrders = empWorks.filter((w) => w.paymentStatus === "PAID").reduce((acc, w) => acc + w.ordersCount, 0);
    const unpaidOrders = totalOrders - paidOrders;
    return { id: emp.id, name: emp.name, totalOrders, paidOrders, unpaidOrders };
  }).filter(e => e.totalOrders > 0).sort((a, b) => b.totalOrders - a.totalOrders);

  return stats;
}

// سجل التدقيق
export async function getAuditLogs(limit = 50) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function addNewOffice(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const allowedIpsString = formData.get("allowedIps") as string;

  if (!name || !username || !password) throw new Error("Missing fields");

  // Process IPs, default to "*" if empty
  const allowedIps = allowedIpsString 
    ? allowedIpsString.split(",").map(ip => ip.trim()).filter(ip => ip.length > 0)
    : ["*"];

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      username,
      password: hashedPassword,
      role: "OFFICE",
      allowedIps,
    }
  });

  revalidatePath("/super-admin");
}

export async function editOffice(officeId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const allowedIpsString = formData.get("allowedIps") as string;

  if (!name || !username) throw new Error("Missing fields");

  const allowedIps = allowedIpsString 
    ? allowedIpsString.split(",").map(ip => ip.trim()).filter(ip => ip.length > 0)
    : ["*"];

  const updateData: any = {
    name,
    username,
    allowedIps,
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: officeId },
    data: updateData,
  });

  revalidatePath("/super-admin");
}

export async function deleteOffice(officeId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await prisma.user.delete({
    where: { id: officeId, role: "OFFICE" },
  });

  revalidatePath("/super-admin");
}

export async function editOfficeSession(sessionId: string, newStartTime: string, newEndTime: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || sessionUser.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const session = await prisma.officeSession.findUnique({ where: { id: sessionId }, include: { office: true } });
  if (!session) throw new Error("Session not found");

  const baseStart = new Date(session.startTime);
  const [startH, startM] = newStartTime.split(':').map(Number);
  const updatedStartTime = new Date(baseStart);
  updatedStartTime.setHours(startH, startM, 0, 0);

  let updatedEndTime = null;
  let durationInMin = null;

  if (newEndTime) {
     const [endH, endM] = newEndTime.split(':').map(Number);
     updatedEndTime = new Date(baseStart);
     updatedEndTime.setHours(endH, endM, 0, 0);
     
     if (updatedEndTime < updatedStartTime) {
       // if end time is conceptually on the next day
       updatedEndTime.setDate(updatedEndTime.getDate() + 1);
     }
     durationInMin = Math.round((updatedEndTime.getTime() - updatedStartTime.getTime()) / 60000);
  }

  await prisma.officeSession.update({
    where: { id: sessionId },
    data: {
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      durationInMin,
    }
  });

  await logAction(sessionUser.user.id, sessionUser.user.name || "", "SUPER_ADMIN", "EDIT_SESSION", `تعديل ساعات الدوام لمكتب ${session.office.name}`);
  revalidatePath("/super-admin");
}

export async function deleteOfficeSession(sessionId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || sessionUser.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const session = await prisma.officeSession.findUnique({ where: { id: sessionId }, include: { office: true } });
  if (session) {
    await prisma.officeSession.delete({ where: { id: sessionId } });
    await logAction(sessionUser.user.id, sessionUser.user.name || "", "SUPER_ADMIN", "DELETE_SESSION", `حذف جلسة عمل لمكتب ${session.office.name}`);
  }

  revalidatePath("/super-admin");
}

export async function addOfficeSession(formData: FormData) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || sessionUser.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const officeId = formData.get("officeId") as string;
  const targetDateStr = formData.get("date") as string;
  const newStartTime = formData.get("startTime") as string;
  const newEndTime = formData.get("endTime") as string;

  if (!officeId || !targetDateStr || !newStartTime) throw new Error("Missing fields");

  const office = await prisma.user.findUnique({ where: { id: officeId } });
  if (!office) throw new Error("Office not found");

  const [year, month, day] = targetDateStr.split('-').map(Number);
  
  const updatedStartTime = new Date(year, month - 1, day);
  const [startH, startM] = newStartTime.split(':').map(Number);
  updatedStartTime.setHours(startH, startM, 0, 0);

  let updatedEndTime = null;
  let durationInMin = null;

  if (newEndTime) {
     const [endH, endM] = newEndTime.split(':').map(Number);
     updatedEndTime = new Date(year, month - 1, day);
     updatedEndTime.setHours(endH, endM, 0, 0);
     
     if (updatedEndTime < updatedStartTime) {
       updatedEndTime.setDate(updatedEndTime.getDate() + 1);
     }
     durationInMin = Math.round((updatedEndTime.getTime() - updatedStartTime.getTime()) / 60000);
  }

  await prisma.officeSession.create({
    data: {
      officeId,
      date: new Date(year, month - 1, day, 12, 0, 0), // Use noon to avoid timezone shift dropping it to previous day if stored in UTC
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      durationInMin,
    }
  });

  await logAction(sessionUser.user.id, sessionUser.user.name || "", "SUPER_ADMIN", "ADD_SESSION", `إضافة جلسة عمل لمكتب ${office.name}`);
  revalidatePath("/super-admin");
}
