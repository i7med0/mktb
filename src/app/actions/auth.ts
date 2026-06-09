"use server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function checkSessionToken(clientToken: string | null) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "OFFICE") return true;

  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id },
    select: { currentToken: true }
  });
  // If no user found or tokens do not match, session is invalid
  if (!user || user.currentToken !== clientToken) return false;

  return true;
}
