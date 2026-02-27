import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    await prisma.$transaction([
      prisma.logEntry.deleteMany({ where: { userId } }),
      prisma.habitLog.deleteMany({ where: { userId } }),
      prisma.dailyCheckin.deleteMany({ where: { userId } }),
      prisma.balanceScore.deleteMany({ where: { userId } }),
      prisma.userAchievement.deleteMany({ where: { userId } }),
      prisma.habit.updateMany({ where: { userId }, data: { currentStreak: 0, longestStreak: 0, level: 1 } }),
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
