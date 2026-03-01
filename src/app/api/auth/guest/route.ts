import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDefaultActions } from "@/lib/seedDefaultActions";

const GUEST_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * GET /api/auth/guest?redirect=/
 * Creates a temporary guest user, sets guest_id cookie (15 min),
 * and redirects back to the original URL.
 */
export async function GET(req: NextRequest) {
  const redirectTo = req.nextUrl.searchParams.get("redirect") || "/";

  // Create guest user with 15-min expiry
  const expiresAt = new Date(Date.now() + GUEST_TTL_MS);
  const guest = await prisma.user.create({
    data: {
      email: `guest_${Date.now()}_${Math.random().toString(36).slice(2)}@guest.local`,
      name: "Guest",
      nickname: "Guest",
      avatarStage: 1,
      isGuest: true,
      guestExpiresAt: expiresAt,
      emailVerified: new Date(),
    },
  });

  // Seed default actions for the guest
  await seedDefaultActions(guest.id, "en").catch(() => {});

  // Set cookie and redirect
  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  res.cookies.set("guest_id", guest.id, {
    maxAge: 15 * 60, // 15 minutes in seconds
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return res;
}
