import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";

// GET — energy history for dashboard
export async function GET(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = parseInt(searchParams.get("range") || "7");

  const since = new Date();
  since.setDate(since.getDate() - range);
  since.setHours(0, 0, 0, 0);

  const logs = await prisma.energyLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
    include: { recoveries: true },
  });

  // Compute stats
  const total = logs.length;
  const avgEnergy = total > 0 ? Math.round(logs.reduce((s, l) => s + l.currentEnergy, 0) / total) : 0;
  const overdraftDays = logs.filter((l) => l.currentEnergy < 0).length;
  const burnoutDays = logs.filter((l) => l.isBurnout).length;
  const avgSleep = total > 0 ? Math.round(logs.reduce((s, l) => s + l.sleepScore, 0) / total) : 0;
  const avgPhysical = total > 0 ? Math.round(logs.reduce((s, l) => s + l.physicalScore, 0) / total) : 0;
  const avgMental = total > 0 ? Math.round(logs.reduce((s, l) => s + l.mentalScore, 0) / total) : 0;

  return NextResponse.json({
    logs,
    stats: { total, avgEnergy, overdraftDays, burnoutDays, avgSleep, avgPhysical, avgMental },
  });
}
