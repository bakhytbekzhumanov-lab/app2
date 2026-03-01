import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getLevel } from "@/lib/xp";
import { getStreakBonus } from "@/lib/coins";
import { getUserTimezone, midnightInTimezone, endOfDayInTimezone, todayForTimezone } from "@/lib/timezone";

const createSchema = z.object({
  actionId: z.string(),
  date: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const weekStart = searchParams.get("weekStart");
    const tz = await getUserTimezone(userId);

    let dateFilter = {};
    if (date) {
      const start = midnightInTimezone(date, tz);
      const end = endOfDayInTimezone(date, tz);
      dateFilter = { date: { gte: start, lte: end } };
    } else if (weekStart) {
      const start = midnightInTimezone(weekStart, tz);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      dateFilter = { date: { gte: start, lt: end } };
    }

    const logs = await prisma.logEntry.findMany({
      where: { userId, ...dateFilter },
      include: { action: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const action = await prisma.action.findFirst({ where: { id: data.actionId, userId } });
    if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

    const logDate = data.date ? new Date(data.date) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.logEntry.create({
        data: { actionId: data.actionId, userId, date: logDate, xpAwarded: action.xp, note: data.note },
        include: { action: true },
      });

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const userTz = user.timezone || "Asia/Almaty";
      const today = todayForTimezone(userTz);
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

      let newStreak = user.currentStreak;
      let coinBonus = 0;

      if (!lastActive || lastActive.getTime() < today.getTime()) {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        if (lastActive && lastActive.getTime() === yesterday.getTime()) {
          newStreak = user.currentStreak + 1;
        } else if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
          newStreak = 1;
        }
        const bonus = getStreakBonus(newStreak);
        if (bonus) coinBonus = bonus;
      }

      const newTotalXp = user.totalXp + action.xp;
      const newLevel = getLevel(newTotalXp);

      await tx.user.update({
        where: { id: userId },
        data: {
          totalXp: newTotalXp, totalCoins: user.totalCoins + coinBonus,
          currentStreak: newStreak, longestStreak: Math.max(user.longestStreak, newStreak),
          lastActiveDate: today, avatarStage: Math.min(newLevel.level, 25),
        },
      });

      return { log, xpAwarded: action.xp, coinBonus, newStreak, level: newLevel.level };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
