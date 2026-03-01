import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { seedDefaultActions } from "@/lib/seedDefaultActions";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  locale: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, locale } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const nickname = email.split("@")[0];

    const user = await prisma.user.create({
      data: {
        name, email, passwordHash, nickname, avatarStage: 1,
        emailVerified: new Date(),
      },
    });

    // Seed 32 default actions (4 per block) for the new user
    await seedDefaultActions(user.id, locale || "en").catch(() => {
      /* non-critical — don't block registration */
    });

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
