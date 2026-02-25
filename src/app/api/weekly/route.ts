import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CAPS } from "@/types";
import type { Block } from "@prisma/client";

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const weekStartParam = searchParams.get("weekStart");
    const weekStart = weekStartParam ? new Date(weekStartParam) : getMonday(new Date());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const [logs, prevLogs, caps] = await Promise.all([
      prisma.logEntry.findMany({ where: { userId: session.user.id, date: { gte: weekStart, lt: weekEnd } }, include: { action: true } }),
      prisma.logEntry.findMany({ where: { userId: session.user.id, date: { gte: prevWeekStart, lt: weekStart } }, include: { action: true } }),
      prisma.cap.findMany(),
    ]);

    const capMap: Record<string, number> = {};
    caps.forEach((c) => { capMap[c.block] = c.value; });

    const blocks: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];
    const blockData = blocks.map((block) => {
      const xp = logs.filter((l) => l.action.block === block).reduce((sum, l) => sum + l.xpAwarded, 0);
      const prevXp = prevLogs.filter((l) => l.action.block === block).reduce((sum, l) => sum + l.xpAwarded, 0);
      const cap = capMap[block] ?? DEFAULT_CAPS[block];
      const percentage = Math.min(Math.round((xp / cap) * 100), 100);
      const trend = xp > prevXp ? "up" : xp < prevXp ? "down" : "same";
      return { block, xp, cap, percentage, trend };
    });

    return NextResponse.json({ blocks: blockData, totalXpWeek: logs.reduce((s, l) => s + l.xpAwarded, 0), weekStart: weekStart.toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
