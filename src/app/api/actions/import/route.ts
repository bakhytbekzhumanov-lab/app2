import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/getAuthUserId";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_BLOCKS = [
  "HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS",
  "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME",
] as const;
const VALID_DIFFICULTIES = [
  "EASY", "NORMAL", "HARD", "VERY_HARD", "LEGENDARY",
] as const;

const rowSchema = z.object({
  name: z.string().min(1),
  block: z.enum(VALID_BLOCKS),
  xp: z.number().int().positive(),
  difficulty: z.enum(VALID_DIFFICULTIES).optional().default("EASY"),
});

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const text = await file.text();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0)
      return NextResponse.json({ error: "Empty file" }, { status: 400 });

    // Skip header row if it looks like one
    const startIdx = lines[0].toLowerCase().includes("name") ? 1 : 0;

    const actions: { name: string; block: (typeof VALID_BLOCKS)[number]; xp: number; difficulty: (typeof VALID_DIFFICULTIES)[number]; userId: string }[] = [];
    const errors: { line: number; error: string }[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      // Support both comma and semicolon separators
      const cols = lines[i].split(/[,;]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length < 3) {
        errors.push({ line: i + 1, error: "Need at least: name, block, xp" });
        continue;
      }

      const parsed = rowSchema.safeParse({
        name: cols[0],
        block: cols[1].toUpperCase(),
        xp: parseInt(cols[2], 10),
        difficulty: cols[3]?.toUpperCase() || "EASY",
      });

      if (!parsed.success) {
        errors.push({ line: i + 1, error: parsed.error.issues.map((e) => e.message).join(", ") });
        continue;
      }

      actions.push({ ...parsed.data, userId });
    }

    if (actions.length > 0) {
      await prisma.action.createMany({ data: actions });
    }

    return NextResponse.json({
      imported: actions.length,
      errors: errors.length,
      total: lines.length - startIdx,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
