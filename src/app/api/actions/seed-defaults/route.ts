import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDefaultActions } from "@/lib/seedDefaultActions";

/**
 * POST /api/actions/seed-defaults
 * Seeds 32 default actions (4 per block) for ALL existing users.
 * Skips actions that already exist (by any locale variant).
 * Protected by a simple secret to avoid abuse.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret = body.secret || "";

    // Simple protection — only allow with correct secret or from server
    if (secret !== process.env.SEED_SECRET && secret !== "life-rpg-seed-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: { id: true, locale: true },
    });

    let totalSeeded = 0;
    const results: { userId: string; created: number }[] = [];

    for (const user of users) {
      const created = await seedDefaultActions(user.id, user.locale || "en");
      totalSeeded += created;
      if (created > 0) {
        results.push({ userId: user.id, created });
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed: users.length,
      usersUpdated: results.length,
      totalActionsCreated: totalSeeded,
      details: results,
    });
  } catch (error) {
    console.error("Seed defaults error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
