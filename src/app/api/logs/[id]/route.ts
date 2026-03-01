import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const log = await prisma.logEntry.findFirst({
      where: { id: params.id, userId },
    });
    if (!log)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.logEntry.delete({ where: { id: params.id } }),
      prisma.user.update({
        where: { id: userId },
        data: { totalXp: { decrement: log.xpAwarded } },
      }),
    ]);

    return NextResponse.json({ success: true, xpReversed: log.xpAwarded });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
