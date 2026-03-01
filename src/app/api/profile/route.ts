import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/xp";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, nickname: true, avatarStage: true,
        totalXp: true, totalCoins: true, currentStreak: true, longestStreak: true,
        phone: true, timezone: true, locale: true, createdAt: true,
        achievements: { include: { achievement: true } },
        _count: { select: { logEntries: true, kanbanTasks: true, habits: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...user, level: getLevel(user.totalXp) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = ["name", "nickname", "phone", "timezone", "locale"];
    const data: Record<string, string> = {};
    for (const key of allowed) { if (key in body) data[key] = body[key]; }

    await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
