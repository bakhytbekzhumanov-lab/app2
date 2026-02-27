import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendVerificationEmail, isEmailConfigured } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const nickname = email.split("@")[0];

    // If email service is not configured, auto-verify users
    const emailEnabled = isEmailConfigured();

    const user = await prisma.user.create({
      data: {
        name, email, passwordHash, nickname, avatarStage: 1,
        emailVerified: emailEnabled ? null : new Date(), // auto-verify if no email service
      },
    });

    if (emailEnabled) {
      // Generate verification token and send email
      const token = crypto.randomUUID();
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      try {
        await sendVerificationEmail(email, token);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Auto-verify if email sending fails — don't lock user out
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
        return NextResponse.json(
          { id: user.id, email: user.email, requiresVerification: false },
          { status: 201 }
        );
      }

      return NextResponse.json(
        { id: user.id, email: user.email, requiresVerification: true },
        { status: 201 }
      );
    }

    // No email verification needed
    return NextResponse.json(
      { id: user.id, email: user.email, requiresVerification: false },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
