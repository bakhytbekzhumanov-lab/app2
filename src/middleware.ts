import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — always allow
  const publicPaths = ["/signin", "/register", "/verify", "/api", "/_next", "/favicon.ico", "/avatars"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check NextAuth JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  // Check guest cookie
  const guestId = req.cookies.get("guest_id")?.value;
  if (guestId) return NextResponse.next();

  // No auth at all → create guest user via /api/auth/guest
  const guestUrl = new URL("/api/auth/guest", req.url);
  guestUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(guestUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|signin|register|verify|avatars).*)",
  ],
};
