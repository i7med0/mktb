"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function getSuperAdminData() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  
  const offices = await prisma.user.findMany({
    where: { role: "OFFICE" },
    include: {
      sessions: { orderBy: { date: 'desc' } },
      dailyRecords: {
        orderBy: { date: 'desc' },
        include: {
          employeeWorks: { include: { employee: true } }
        }
      }
    }
  });

  return { offices };
}

export async function togglePaymentStatus(workId: string, currentStatus: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const newStatus = currentStatus === "PAID" ? "UNPAID" : "PAID";
  
  await prisma.employeeWork.update({
    where: { id: workId },
    data: { paymentStatus: newStatus }
  });

  revalidatePath("/super-admin");
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
