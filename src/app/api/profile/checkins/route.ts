import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, todayForTimezone } from "@/lib/timezone";

export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const range = parseInt(searchParams.get("range") ?? "90");
    const tz = await getUserTimezone(userId);
    const todayMidnight = todayForTimezone(tz);
    const since = new Date(todayMidnight.getTime() - range * 24 * 60 * 60 * 1000);

    return NextResponse.json(
      await prisma.dailyCheckin.findMany({ where: { userId, date: { gte: since } }, orderBy: { date: "asc" } })
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
