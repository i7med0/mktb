"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

// Helper to get today's date safely (setting time to 00:00:00)
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export async function getOfficeStats() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  
  const today = getToday();
  const officeId = session.user.id;

  // 1. Get Daily Record
  let dailyRecord = await prisma.dailyRecord.findUnique({
    where: { officeId_date: { officeId, date: today } },
    include: { employeeWorks: { include: { employee: true } } }
  });

  if (!dailyRecord) {
    dailyRecord = await prisma.dailyRecord.create({
      data: { officeId, date: today, totalOrders: 0 },
      include: { employeeWorks: { include: { employee: true } } }
    });
  }

  // 2. Get ALL Employees for the system
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, name: true, username: true }
  });

  // 3. Get Active Session if any
  const activeSession = await prisma.officeSession.findFirst({
    where: { officeId, date: today, endTime: null },
    orderBy: { startTime: 'desc' }
  });

  return { dailyRecord, employees, activeSession };
}

export async function updateDailyTotal(totalOrders: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  const today = getToday();

  await prisma.dailyRecord.upsert({
    where: { officeId_date: { officeId: session.user.id, date: today } },
    update: { totalOrders },
    create: { officeId: session.user.id, date: today, totalOrders },
  });

  revalidatePath("/office");
}

export async function assignOrderToEmployee(employeeId: string, count: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  const today = getToday();

  const dailyRecord = await prisma.dailyRecord.findUnique({
    where: { officeId_date: { officeId: session.user.id, date: today } }
  });

  if (!dailyRecord) throw new Error("Daily record not found");

  await prisma.employeeWork.upsert({
    where: { dailyRecordId_employeeId: { dailyRecordId: dailyRecord.id, employeeId } },
    update: { ordersCount: count },
    create: { dailyRecordId: dailyRecord.id, employeeId, ordersCount: count },
  });

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
      officeId: session.user.id,
    }
  });

  revalidatePath("/office");
}

export async function startSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OFFICE") throw new Error("Unauthorized");
  const today = getToday();

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
  const today = getToday();

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
