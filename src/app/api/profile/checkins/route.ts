import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const range = parseInt(searchParams.get("range") ?? "90");
    const since = new Date(); since.setDate(since.getDate() - range); since.setHours(0, 0, 0, 0);

    return NextResponse.json(
      await prisma.dailyCheckin.findMany({ where: { userId: session.user.id, date: { gte: since } }, orderBy: { date: "asc" } })
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
