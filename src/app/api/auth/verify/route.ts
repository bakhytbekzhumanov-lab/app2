import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/signin?error=MissingToken", req.url));
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record || record.expires < new Date()) {
      // Delete expired token if exists
      if (record) {
        await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      }
      return NextResponse.redirect(new URL("/signin?error=InvalidToken", req.url));
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.redirect(new URL("/signin?verified=true", req.url));
  } catch {
    return NextResponse.redirect(new URL("/signin?error=VerificationFailed", req.url));
  }
}
