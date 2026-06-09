"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { autoCloseStaleSessions } from "@/lib/sessions";
import { logAction } from "@/lib/audit";

// Helper to get target date safely (setting time to 00:00:00)
const getTargetDate = (dateStr?: string) => {
  const target = new Date();
  if (dateStr === "yesterday") {
    target.setDate(target.getDate() - 1);
  }
  target.setHours(0, 0, 0, 0);
  return target;
};

export async function getOfficeStats(dateStr?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  
  autoCloseStaleSessions().catch(console.error);
  
  const targetDate = getTargetDate(dateStr);
  const officeId = session.user.id;

  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

  const [employees, activeSession, monthlySessions, dailyRecordResult] = await Promise.all([
    // 1. Get ALL active Employees for the system
    prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { id: true, name: true, username: true }
    }),
    // 2. Get Active Session if any
    prisma.officeSession.findFirst({
      where: { officeId, date: targetDate, endTime: null },
      orderBy: { startTime: 'desc' }
    }),
    // 3. Calculate Monthly Stats
    prisma.officeSession.findMany({
      where: { 
        officeId, 
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    }),
    // 4. Get Daily Record
    prisma.dailyRecord.findUnique({
      where: { date: targetDate },
      include: { employeeWorks: { include: { employee: true } } }
    })
  ]);

  let dailyRecord = dailyRecordResult;

  if (!dailyRecord) {
    dailyRecord = await prisma.dailyRecord.create({
      data: { date: targetDate, totalOrders: 0 },
      include: { employeeWorks: { include: { employee: true } } }
    });
  }

  const monthlyTotalMinutes = monthlySessions.reduce((acc, session) => acc + (session.durationInMin || 0), 0);
  const monthlyStats = {
    totalHours: Math.floor(monthlyTotalMinutes / 60),
    remainingMinutes: monthlyTotalMinutes % 60,
  };

  return { dailyRecord, employees, activeSession, monthlyStats };
}

export async function updateDailyTotal(totalOrders: number, dateStr?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  const targetDate = getTargetDate(dateStr);

  await prisma.dailyRecord.upsert({
    where: { date: targetDate },
    update: { totalOrders },
    create: { date: targetDate, totalOrders },
  });

  revalidatePath("/office");
}

export async function assignOrderToEmployee(employeeId: string, count: number, dateStr?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  const targetDate = getTargetDate(dateStr);

  const dailyRecord = await prisma.dailyRecord.findUnique({
    where: { date: targetDate }
  });

  if (!dailyRecord) throw new Error("Daily record not found");

  await prisma.employeeWork.upsert({
    where: { dailyRecordId_employeeId: { dailyRecordId: dailyRecord.id, employeeId } },
    update: { ordersCount: { increment: count } },
    create: { dailyRecordId: dailyRecord.id, employeeId, ordersCount: count },
  });

  // سجل التدقيق
  const emp = await prisma.user.findUnique({ where: { id: employeeId }, select: { name: true } });
  await logAction(session.user.id, session.user.name || session.user.username, "OFFICE", "ASSIGN", `توزيع ${count} طلب للموظف: ${emp?.name || employeeId}`);

  revalidatePath("/office");
}

export async function addNewEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!name || !username || !password) throw new Error("Missing fields");

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      username,
      password: hashedPassword,
      role: "EMPLOYEE",
      // Employees are shared, no specific officeId
    }
  });

  revalidatePath("/office");
}

export async function startSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  const today = getTargetDate();

  const existing = await prisma.officeSession.findFirst({
    where: { officeId: session.user.id, date: today, endTime: null }
  });

  if (!existing) {
    await prisma.officeSession.create({
      data: { officeId: session.user.id, date: today }
    });
  }
  revalidatePath("/office");
}

export async function endSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  const today = getTargetDate();

  const active = await prisma.officeSession.findFirst({
    where: { officeId: session.user.id, date: today, endTime: null }
  });

  if (active) {
    const endTime = new Date();
    const durationInMin = Math.round((endTime.getTime() - active.startTime.getTime()) / 60000);
    
    await prisma.officeSession.update({
      where: { id: active.id },
      data: { endTime, durationInMin }
    });
  }
  revalidatePath("/office");
}

export async function editAssignedWork(workId: string, count: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");

  await prisma.employeeWork.update({
    where: { id: workId },
    data: { ordersCount: count },
  });

  await logAction(session.user.id, session.user.name || session.user.username, "OFFICE", "EDIT_WORK", `تعديل التوزيع ${workId} إلى ${count} طلب`);

  revalidatePath("/office");
}

export async function deleteAssignedWork(workId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");

  await prisma.employeeWork.delete({
    where: { id: workId },
  });

  await logAction(session.user.id, session.user.name || session.user.username, "OFFICE", "DELETE_WORK", `حذف التوزيع: ${workId}`);

  revalidatePath("/office");
}

export async function editEmployee(employeeId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!name || !username) throw new Error("Missing fields");

  const updateData: any = { name, username };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  // Ensure employee is in the system
  const employee = await prisma.user.findFirst({
    where: { id: employeeId, role: "EMPLOYEE" }
  });

  if (!employee) throw new Error("Employee not found or access denied");

  await prisma.user.update({
    where: { id: employeeId },
    data: updateData,
  });

  revalidatePath("/office");
}

export async function deleteEmployee(employeeId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");

  const employee = await prisma.user.findFirst({
    where: { id: employeeId, role: "EMPLOYEE" }
  });

  if (!employee) throw new Error("Employee not found or access denied");

  await prisma.user.update({
    where: { id: employeeId },
    data: { isActive: false }, // Soft Delete (أرشفة)
  });

  await logAction(session.user.id, session.user.name || session.user.username, "OFFICE", "ARCHIVE_EMPLOYEE", `أرشفة الموظف (حساب غير نشط): ${employee.name}`);

  revalidatePath("/office");
}
