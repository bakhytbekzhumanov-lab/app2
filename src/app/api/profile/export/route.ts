import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [actions, logs, habits, habitLogs] = await Promise.all([
      prisma.action.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.logEntry.findMany({ where: { userId }, include: { action: { select: { name: true, block: true } } }, orderBy: { date: "desc" } }),
      prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.habitLog.findMany({ where: { userId }, include: { habit: { select: { name: true, block: true } } }, orderBy: { date: "desc" } }),
    ]);

    // Build CSV strings
    const actionsCsv = "name,block,xp,difficulty,isActive,createdAt\n" +
      actions.map((a) => `"${a.name}",${a.block},${a.xp},${a.difficulty},${a.isActive},${a.createdAt.toISOString()}`).join("\n");

    const logsCsv = "action,block,xpAwarded,date,note\n" +
      logs.map((l) => `"${l.action.name}",${l.action.block},${l.xpAwarded},${l.date.toISOString()},"${l.note || ""}"`).join("\n");

    const habitsCsv = "name,block,frequency,xpPerLog,currentStreak,longestStreak,level,isActive,createdAt\n" +
      habits.map((h) => `"${h.name}",${h.block},${h.frequency},${h.xpPerLog},${h.currentStreak},${h.longestStreak},${h.level},${h.isActive},${h.createdAt.toISOString()}`).join("\n");

    const habitLogsCsv = "habit,block,date,completed\n" +
      habitLogs.map((hl) => `"${hl.habit.name}",${hl.habit.block},${hl.date.toISOString()},${hl.completed}`).join("\n");

    return NextResponse.json({
      actions: actionsCsv,
      logs: logsCsv,
      habits: habitsCsv,
      habitLogs: habitLogsCsv,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
