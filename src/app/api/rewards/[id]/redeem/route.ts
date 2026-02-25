import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reward = await prisma.reward.findFirst({ where: { id: params.id, userId: session.user.id, isRedeemed: false } });
    if (!reward) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.totalCoins < reward.coinCost) return NextResponse.json({ error: "Not enough coins" }, { status: 400 });

    await prisma.$transaction([
      prisma.reward.update({ where: { id: params.id }, data: { isRedeemed: true, redeemedAt: new Date() } }),
      prisma.user.update({ where: { id: session.user.id }, data: { totalCoins: { decrement: reward.coinCost } } }),
    ]);
    return NextResponse.json({ success: true, remaining: user.totalCoins - reward.coinCost });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
