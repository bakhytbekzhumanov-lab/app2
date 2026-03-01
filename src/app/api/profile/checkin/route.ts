import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getUserTimezone, midnightInTimezone } from "@/lib/timezone";

const checkinSchema = z.object({
  date: z.string(),
  mainTaskDone: z.boolean(),
  totalTasks: z.number().int().optional(),
  completedTasks: z.number().int().optional(),
  xpEarned: z.number().int().optional(),
  energyLevel: z.number().int().min(1).max(5).nullable().optional(),
  moodLevel: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = checkinSchema.parse(await req.json());
    const tz = await getUserTimezone(userId);
    const date = midnightInTimezone(data.date, tz);

    const checkin = await prisma.dailyCheckin.upsert({
      where: { userId_date: { userId, date } },
      update: { ...data, date },
      create: { ...data, date, userId },
    });
    return NextResponse.json(checkin);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
