import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { RECOVERY_TYPES, MAX_ENERGY } from "@/lib/energy";
import { getUserTimezone, todayForTimezone } from "@/lib/timezone";

// POST — apply recovery action
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tz = await getUserTimezone(userId);

  const body = await req.json();
  const recoveryType = body.type as string;

  const recoveryDef = RECOVERY_TYPES.find((r) => r.type === recoveryType);
  if (!recoveryDef) return NextResponse.json({ error: "Invalid recovery type" }, { status: 400 });

  const date = todayForTimezone(tz);

  // Get or create today's log
  let log = await prisma.energyLog.findUnique({
    where: { userId_date: { userId, date } },
    include: { recoveries: true },
  });

  if (!log) {
    log = await prisma.energyLog.create({
      data: { userId, date, baseEnergy: 100, currentEnergy: 100 },
      include: { recoveries: true },
    });
  }

  // Check daily limit
  const usedToday = log.recoveries.filter((r) => r.type === recoveryType).length;
  if (usedToday >= recoveryDef.maxPerDay) {
    return NextResponse.json({ error: "Daily limit reached for this recovery" }, { status: 400 });
  }

  // Cap at max energy
  const epToRestore = Math.min(recoveryDef.ep, MAX_ENERGY - log.currentEnergy);
  const newEnergy = log.currentEnergy + Math.max(epToRestore, 0);

  // Create recovery record
  await prisma.energyRecovery.create({
    data: { energyLogId: log.id, type: recoveryType, epRestored: Math.max(epToRestore, 0) },
  });

  // Update energy log
  const updated = await prisma.energyLog.update({
    where: { id: log.id },
    data: {
      currentEnergy: newEnergy,
      recoveredTotal: { increment: Math.max(epToRestore, 0) },
    },
    include: { recoveries: true },
  });

  return NextResponse.json(updated);
}
