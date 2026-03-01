import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { SLEEP_MAX, PHYSICAL_MAX, MENTAL_MAX, BURNOUT_PENALTY, calcBaseEnergy } from "@/lib/energy";
import { getUserTimezone, todayForTimezone } from "@/lib/timezone";

// GET — get today's energy (create if missing)
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tz = await getUserTimezone(userId);
  const date = todayForTimezone(tz);

  let log = await prisma.energyLog.findUnique({
    where: { userId_date: { userId, date } },
    include: { recoveries: true },
  });

  if (!log) {
    // Check burnout: count consecutive overdraft days before today
    const recentLogs = await prisma.energyLog.findMany({
      where: { userId, date: { lt: date } },
      orderBy: { date: "desc" },
      take: 5,
    });

    let consecutiveOverdraft = 0;
    for (const rl of recentLogs) {
      if (rl.currentEnergy < 0) consecutiveOverdraft++;
      else break;
    }

    const isBurnout = consecutiveOverdraft >= 3;

    log = await prisma.energyLog.create({
      data: {
        userId,
        date,
        baseEnergy: 100,
        currentEnergy: 100,
        isBurnout,
      },
      include: { recoveries: true },
    });
  }

  return NextResponse.json(log);
}

// POST — morning energy input
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tz = await getUserTimezone(userId);

  const body = await req.json();
  const sleepScore = Math.min(Math.max(body.sleepScore || 0, 0), SLEEP_MAX);
  const physicalScore = Math.min(Math.max(body.physicalScore || 0, 0), PHYSICAL_MAX);
  const mentalScore = Math.min(Math.max(body.mentalScore || 0, 0), MENTAL_MAX);

  // Weighted formula: sleep × 0.4 + physical × 0.3 + mental × 0.3 = max 100
  let baseEnergy = calcBaseEnergy(sleepScore, physicalScore, mentalScore);

  const date = todayForTimezone(tz);

  // Check burnout
  const recentLogs = await prisma.energyLog.findMany({
    where: { userId, date: { lt: date } },
    orderBy: { date: "desc" },
    take: 5,
  });

  let consecutiveOverdraft = 0;
  for (const rl of recentLogs) {
    if (rl.currentEnergy < 0) consecutiveOverdraft++;
    else break;
  }
  const isBurnout = consecutiveOverdraft >= 3;

  // Check sleep streak for bonus (75+ out of 100 = good sleep)
  let sleepStreak = 0;
  for (const rl of recentLogs) {
    if (rl.sleepScore >= 75) sleepStreak++;
    else break;
  }

  // Check routine streak (morning done)
  let routineStreak = 0;
  for (const rl of recentLogs) {
    if (rl.morningDone) routineStreak++;
    else break;
  }

  let streakBonus = 0;
  if (sleepStreak >= 5) streakBonus += 5;
  if (routineStreak >= 3) streakBonus += 10;

  if (isBurnout) {
    baseEnergy = Math.round(baseEnergy * BURNOUT_PENALTY);
  }

  const currentEnergy = baseEnergy + streakBonus;

  const log = await prisma.energyLog.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      sleepScore,
      physicalScore,
      mentalScore,
      baseEnergy,
      currentEnergy,
      streakBonus,
      isBurnout,
      morningDone: true,
    },
    update: {
      sleepScore,
      physicalScore,
      mentalScore,
      baseEnergy,
      currentEnergy: { set: currentEnergy - (0) }, // we'll calculate spent
      streakBonus,
      isBurnout,
      morningDone: true,
    },
    include: { recoveries: true },
  });

  // If updating, recalculate current = base + streakBonus + recovered - spent
  if (log.spentTotal > 0 || log.recoveredTotal > 0) {
    const recalculated = baseEnergy + streakBonus + log.recoveredTotal - log.spentTotal;
    await prisma.energyLog.update({
      where: { id: log.id },
      data: { currentEnergy: recalculated },
    });
    log.currentEnergy = recalculated;
  }

  return NextResponse.json(log);
}
