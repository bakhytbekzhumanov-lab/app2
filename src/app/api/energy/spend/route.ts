import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { MIN_ENERGY } from "@/lib/energy";
import { getUserTimezone, todayForTimezone } from "@/lib/timezone";

// POST — spend energy on a task
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tz = await getUserTimezone(userId);

  const body = await req.json();
  const amount = Math.max(body.amount || 0, 0);
  if (amount === 0) return NextResponse.json({ error: "Amount required" }, { status: 400 });

  const date = todayForTimezone(tz);

  // Get or create today's log
  let log = await prisma.energyLog.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!log) {
    log = await prisma.energyLog.create({
      data: { userId, date, baseEnergy: 100, currentEnergy: 100 },
    });
  }

  // Apply overdraft penalty: 1.5x cost if already in overdraft
  const effectiveAmount = log.currentEnergy < 0 ? Math.round(amount * 1.5) : amount;

  // Check if we'd go below minimum
  const newEnergy = Math.max(log.currentEnergy - effectiveAmount, MIN_ENERGY);
  const actualSpent = log.currentEnergy - newEnergy;

  const updated = await prisma.energyLog.update({
    where: { id: log.id },
    data: {
      currentEnergy: newEnergy,
      spentTotal: { increment: actualSpent },
    },
  });

  return NextResponse.json({
    currentEnergy: updated.currentEnergy,
    spent: actualSpent,
    isOverdraft: updated.currentEnergy < 0,
  });
}
