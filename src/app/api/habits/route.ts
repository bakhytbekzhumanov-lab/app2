import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  block: z.enum(["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"]),
  frequency: z.enum(["DAILY", "WEEKDAYS", "THREE_PER_WEEK", "CUSTOM"]).optional(),
  customDays: z.array(z.number()).optional(),
  targetPerWeek: z.number().int().positive().optional(),
  xpPerLog: z.number().int().positive().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: { logs: { orderBy: { date: "desc" }, take: 90 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(habits);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createSchema.parse(body);
    const habit = await prisma.habit.create({ data: { ...data, userId: session.user.id } });
    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
