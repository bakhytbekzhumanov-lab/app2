import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/**
 * Returns the authenticated user's ID.
 * 1. Tries NextAuth session first (real user)
 * 2. Falls back to guest_id cookie (guest user, not expired)
 * 3. Returns null if neither
 */
export async function getAuthUserId(): Promise<string | null> {
  // 1. Check NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  // 2. Check guest cookie
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;
  if (!guestId) return null;

  // Validate guest user exists and is not expired
  const guest = await prisma.user.findFirst({
    where: {
      id: guestId,
      isGuest: true,
      guestExpiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  return guest?.id ?? null;
}
