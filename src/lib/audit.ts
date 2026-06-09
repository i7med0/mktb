"use server";

import prisma from "@/lib/prisma";

export async function logAction(
  actorId: string,
  actorName: string,
  actorRole: string,
  action: string,
  description: string
) {
  try {
    await prisma.auditLog.create({
      data: { actorId, actorName, actorRole, action, description }
    });
  } catch {
    // نتجاهل أخطاء الـ audit log لتجنب تعطيل العمليات الأصلية
  }
}
