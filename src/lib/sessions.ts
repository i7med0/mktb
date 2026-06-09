import prisma from "@/lib/prisma";

export async function autoCloseStaleSessions() {
  const now = new Date();
  
  // Find all open sessions
  const openSessions = await prisma.officeSession.findMany({
    where: { endTime: null }
  });

  for (const session of openSessions) {
    // Session date is stored at 00:00:00 of the respective day
    const sessionDate = new Date(session.date);
    
    // Target close time: next day at 2:00 AM
    const targetCloseTime = new Date(sessionDate);
    targetCloseTime.setDate(targetCloseTime.getDate() + 1);
    targetCloseTime.setHours(2, 0, 0, 0);

    if (now > targetCloseTime) {
      // It's past 2 AM of the next day. Close it.
      const durationInMin = Math.round((targetCloseTime.getTime() - session.startTime.getTime()) / 60000);
      
      await prisma.officeSession.update({
        where: { id: session.id },
        data: {
          endTime: targetCloseTime,
          durationInMin: Math.max(0, durationInMin)
        }
      });
    }
  }
}
