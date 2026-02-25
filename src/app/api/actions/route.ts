import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  block: z.enum(["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"]),
  xp: z.number().int().positive(),
  difficulty: z.enum(["EASY", "NORMAL", "HARD", "VERY_HARD", "LEGENDARY"]).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actions = await prisma.action.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(actions);
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
    const action = await prisma.action.create({
      data: { ...data, difficulty: data.difficulty ?? "EASY", userId: session.user.id },
    });
    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
