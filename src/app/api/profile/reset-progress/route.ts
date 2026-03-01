import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.$transaction([
      // Delete all logs and history
      prisma.logEntry.deleteMany({ where: { userId } }),
      prisma.habitLog.deleteMany({ where: { userId } }),
      prisma.dailyCheckin.deleteMany({ where: { userId } }),
      prisma.balanceScore.deleteMany({ where: { userId } }),
      prisma.userAchievement.deleteMany({ where: { userId } }),
      // Delete all kanban cards
      prisma.kanbanTask.deleteMany({ where: { userId } }),
      // Delete all energy logs (cascades to EnergyRecovery)
      prisma.energyLog.deleteMany({ where: { userId } }),
      // Delete all habits (active + archived) so they return to "recommended"
      prisma.habit.deleteMany({ where: { userId } }),
      // Reset user stats
      prisma.user.update({
        where: { id: userId },
        data: { totalXp: 0, totalCoins: 0, currentStreak: 0, longestStreak: 0, avatarStage: 1 },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
