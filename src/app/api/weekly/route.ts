import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CAPS } from "@/types";
import { calcKanbanXP } from "@/lib/xp";
import type { Block } from "@prisma/client";
import { getUserTimezone, weekStartForTimezone, midnightInTimezone } from "@/lib/timezone";

export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tz = await getUserTimezone(userId);
    const { searchParams } = new URL(req.url);
    const weekStartParam = searchParams.get("weekStart");
    const weekStart = weekStartParam ? midnightInTimezone(weekStartParam, tz) : weekStartForTimezone(tz);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const [logs, prevLogs, caps, kanbanDone, prevKanbanDone] = await Promise.all([
      prisma.logEntry.findMany({ where: { userId, date: { gte: weekStart, lt: weekEnd } }, include: { action: true } }),
      prisma.logEntry.findMany({ where: { userId, date: { gte: prevWeekStart, lt: weekStart } }, include: { action: true } }),
      prisma.cap.findMany(),
      prisma.kanbanTask.findMany({
        where: { userId, status: "DONE", block: { not: null }, completedAt: { gte: weekStart, lt: weekEnd } },
      }),
      prisma.kanbanTask.findMany({
        where: { userId, status: "DONE", block: { not: null }, completedAt: { gte: prevWeekStart, lt: weekStart } },
      }),
    ]);

    const capMap: Record<string, number> = {};
    caps.forEach((c) => { capMap[c.block] = c.value; });

    const blocks: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];
    const blockData = blocks.map((block) => {
      const logXp = logs.filter((l) => l.action.block === block).reduce((sum, l) => sum + l.xpAwarded, 0);
      const prevLogXp = prevLogs.filter((l) => l.action.block === block).reduce((sum, l) => sum + l.xpAwarded, 0);
      const kanbanXp = kanbanDone.filter((t) => t.block === block).reduce((sum, t) => sum + calcKanbanXP(t.importance, t.discomfort, t.urgency), 0);
      const prevKanbanXp = prevKanbanDone.filter((t) => t.block === block).reduce((sum, t) => sum + calcKanbanXP(t.importance, t.discomfort, t.urgency), 0);

      const xp = logXp + kanbanXp;
      const prevXp = prevLogXp + prevKanbanXp;
      const cap = capMap[block] ?? DEFAULT_CAPS[block];
      const percentage = Math.min(Math.round((xp / cap) * 100), 100);
      const trend = xp > prevXp ? "up" : xp < prevXp ? "down" : "same";
      return { block, xp, cap, percentage, trend };
    });

    const totalLogXp = logs.reduce((s, l) => s + l.xpAwarded, 0);
    const totalKanbanXp = kanbanDone.reduce((s, t) => s + calcKanbanXP(t.importance, t.discomfort, t.urgency), 0);

    return NextResponse.json({ blocks: blockData, totalXpWeek: totalLogXp + totalKanbanXp, weekStart: weekStart.toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
