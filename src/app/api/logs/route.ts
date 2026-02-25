import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getLevel } from "@/lib/xp";
import { getStreakBonus } from "@/lib/coins";

const createSchema = z.object({
  actionId: z.string(),
  date: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const weekStart = searchParams.get("weekStart");

    let dateFilter = {};
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      dateFilter = { date: { gte: start, lte: end } };
    } else if (weekStart) {
      const start = new Date(weekStart); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 7);
      dateFilter = { date: { gte: start, lt: end } };
    }

    const logs = await prisma.logEntry.findMany({
      where: { userId: session.user.id, ...dateFilter },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const action = await prisma.action.findFirst({ where: { id: data.actionId, userId: session.user.id } });
    if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

    const logDate = data.date ? new Date(data.date) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.logEntry.create({
        data: { actionId: data.actionId, userId: session.user.id, date: logDate, xpAwarded: action.xp, note: data.note },
        include: { action: true },
      });

      const user = await tx.user.findUnique({ where: { id: session.user.id } });
      if (!user) throw new Error("User not found");

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
      lastActive?.setHours(0, 0, 0, 0);

      let newStreak = user.currentStreak;
      let coinBonus = 0;

      if (!lastActive || lastActive.getTime() < today.getTime()) {
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
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
        where: { id: session.user.id },
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
