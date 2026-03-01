import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getHabitLevel } from "@/lib/habitLevels";
import { getUserTimezone, midnightInTimezone } from "@/lib/timezone";

const logSchema = z.object({ date: z.string(), completed: z.boolean().optional() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = logSchema.parse(body);
    const tz = await getUserTimezone(userId);
    const logDate = midnightInTimezone(data.date, tz);

    const habit = await prisma.habit.findFirst({ where: { id: params.id, userId } });
    if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

    const completed = data.completed !== false;
    const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId: params.id, date: logDate } } });

    if (existing) {
      if (!completed) {
        await prisma.$transaction([
          prisma.habitLog.delete({ where: { id: existing.id } }),
          prisma.user.update({ where: { id: userId }, data: { totalXp: { decrement: habit.xpPerLog } } }),
        ]);
        return NextResponse.json({ removed: true });
      }
      return NextResponse.json(existing);
    }
    if (!completed) return NextResponse.json({ removed: true });

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.habitLog.create({ data: { habitId: params.id, userId, date: logDate, completed: true } });

      // Calculate level and XP multiplier
      const totalLogs = await tx.habitLog.count({ where: { habitId: params.id, completed: true } });
      const levelInfo = getHabitLevel(totalLogs);
      const xpToAward = Math.round(habit.xpPerLog * levelInfo.xpMultiplier);

      await tx.user.update({ where: { id: userId }, data: { totalXp: { increment: xpToAward } } });

      // Update habit level
      await tx.habit.update({ where: { id: params.id }, data: { level: levelInfo.level } });

      return { log, xpAwarded: xpToAward, newLevel: levelInfo.level, levelTitle: levelInfo.title };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
