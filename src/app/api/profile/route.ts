import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/xp";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, nickname: true, avatarStage: true,
        totalXp: true, totalCoins: true, currentStreak: true, longestStreak: true,
        locale: true, createdAt: true,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = ["nickname", "locale"];
    const data: Record<string, string> = {};
    for (const key of allowed) { if (key in body) data[key] = body[key]; }

    await prisma.user.update({ where: { id: session.user.id }, data });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
