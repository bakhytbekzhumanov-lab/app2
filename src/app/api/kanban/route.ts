import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "ARCHIVED"]).optional(),
  owner: z.enum(["MINE", "DELEGATED", "STUCK"]).optional(),
  importance: z.number().int().min(1).max(10).optional(),
  discomfort: z.number().int().min(1).max(10).optional(),
  urgency: z.number().int().min(1).max(10).optional(),
  block: z.enum(["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"]).nullable().optional(),
  delegatedTo: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tasks = await prisma.kanbanTask.findMany({
      where: { userId: session.user.id, status: { not: "ARCHIVED" } },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
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
    const task = await prisma.kanbanTask.create({
      data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : null, userId: session.user.id },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
