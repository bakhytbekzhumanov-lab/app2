import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = checkinSchema.parse(await req.json());
    const date = new Date(data.date); date.setHours(0, 0, 0, 0);

    const checkin = await prisma.dailyCheckin.upsert({
      where: { userId_date: { userId: session.user.id, date } },
      update: { ...data, date },
      create: { ...data, date, userId: session.user.id },
    });
    return NextResponse.json(checkin);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
