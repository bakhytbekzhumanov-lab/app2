import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/guest/cleanup
 * Deletes all expired guest users and their related data.
 * Can be called by a cron job or manually.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret = body.secret || "";

    // Simple protection
    if (secret !== process.env.SEED_SECRET && secret !== "life-rpg-seed-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all expired guest users (cascade deletes their data)
    const result = await prisma.user.deleteMany({
      where: {
        isGuest: true,
        guestExpiresAt: { lt: new Date() },
      },
    });

    return NextResponse.json({
      success: true,
      deletedGuests: result.count,
    });
  } catch (error) {
    console.error("Guest cleanup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
