import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/cleanup-guests
 * Called by Vercel Cron every 15 minutes.
 * Deletes expired guest users and all their cascade data.
 */
export async function GET(req: NextRequest) {
  // Verify the cron request (Vercel sends CRON_SECRET header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.user.deleteMany({
      where: {
        isGuest: true,
        guestExpiresAt: { lt: new Date() },
      },
    });

    return NextResponse.json({
      ok: true,
      deletedGuests: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron cleanup-guests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
