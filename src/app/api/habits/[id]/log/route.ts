import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getHabitLevel } from "@/lib/habitLevels";

const logSchema = z.object({ date: z.string(), completed: z.boolean().optional() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = logSchema.parse(body);
    const logDate = new Date(data.date); logDate.setHours(0, 0, 0, 0);

    const habit = await prisma.habit.findFirst({ where: { id: params.id, userId: session.user.id } });
    if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

    const completed = data.completed !== false;
    const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId: params.id, date: logDate } } });

    if (existing) {
      if (!completed) {
        await prisma.$transaction([
          prisma.habitLog.delete({ where: { id: existing.id } }),
          prisma.user.update({ where: { id: session.user.id }, data: { totalXp: { decrement: habit.xpPerLog } } }),
        ]);
        return NextResponse.json({ removed: true });
      }
      return NextResponse.json(existing);
    }
    if (!completed) return NextResponse.json({ removed: true });

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.habitLog.create({ data: { habitId: params.id, userId: session.user.id, date: logDate, completed: true } });

      // Calculate level and XP multiplier
      const totalLogs = await tx.habitLog.count({ where: { habitId: params.id, completed: true } });
      const levelInfo = getHabitLevel(totalLogs);
      const xpToAward = Math.round(habit.xpPerLog * levelInfo.xpMultiplier);

      await tx.user.update({ where: { id: session.user.id }, data: { totalXp: { increment: xpToAward } } });

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
