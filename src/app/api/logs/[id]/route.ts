import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const log = await prisma.logEntry.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!log)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.logEntry.delete({ where: { id: params.id } }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { totalXp: { decrement: log.xpAwarded } },
      }),
    ]);

    return NextResponse.json({ success: true, xpReversed: log.xpAwarded });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
