import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { calcKanbanXP } from "@/lib/xp";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (body.dueDate) body.dueDate = new Date(body.dueDate);
    if (body.mainTaskDate) body.mainTaskDate = new Date(body.mainTaskDate);

    const existing = await prisma.kanbanTask.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const movingToDone = body.status === "DONE" && existing.status !== "DONE";
    if (movingToDone) {
      body.completedAt = new Date();
      const xp = calcKanbanXP(body.importance ?? existing.importance, body.discomfort ?? existing.discomfort, body.urgency ?? existing.urgency);
      await prisma.$transaction([
        prisma.kanbanTask.update({ where: { id: params.id }, data: body }),
        prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: xp } } }),
      ]);

      // If this is a main task with a date, auto-checkin for that date
      const isMain = body.isMainTask ?? existing.isMainTask;
      const mainDate = body.mainTaskDate ?? existing.mainTaskDate;
      if (isMain && mainDate) {
        const checkinDate = new Date(mainDate);
        checkinDate.setHours(0, 0, 0, 0);
        await prisma.dailyCheckin.upsert({
          where: { userId_date: { userId, date: checkinDate } },
          create: { userId, date: checkinDate, mainTaskDone: true, xpEarned: xp },
          update: { mainTaskDone: true, xpEarned: { increment: xp } },
        });
      }

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
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await prisma.kanbanTask.deleteMany({ where: { id: params.id, userId } });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
