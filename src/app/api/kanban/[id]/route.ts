import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcKanbanXP } from "@/lib/xp";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (body.dueDate) body.dueDate = new Date(body.dueDate);

    const existing = await prisma.kanbanTask.findFirst({ where: { id: params.id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const movingToDone = body.status === "DONE" && existing.status !== "DONE";
    if (movingToDone) {
      body.completedAt = new Date();
      const xp = calcKanbanXP(body.importance ?? existing.importance, body.discomfort ?? existing.discomfort, body.urgency ?? existing.urgency);
      await prisma.$transaction([
        prisma.kanbanTask.update({ where: { id: params.id }, data: body }),
        prisma.user.update({ where: { id: session.user.id }, data: { totalXp: { increment: xp } } }),
      ]);
      return NextResponse.json({ success: true, xpAwarded: xp });
    }

    await prisma.kanbanTask.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await prisma.kanbanTask.deleteMany({ where: { id: params.id, userId: session.user.id } });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
