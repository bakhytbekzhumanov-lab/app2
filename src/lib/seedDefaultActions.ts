import { prisma } from "@/lib/prisma";
import { DEFAULT_ACTIONS, getActionName } from "@/data/defaultActions";

/**
 * Creates 32 default actions (4 per block) for a user.
 * Uses the user's locale to pick the right name.
 * Skips actions whose name already exists for that user.
 */
export async function seedDefaultActions(
  userId: string,
  locale: string = "en"
): Promise<number> {
  // Get existing action names for this user to avoid duplicates
  const existing = await prisma.action.findMany({
    where: { userId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((a) => a.name.toLowerCase()));

  // Also build a set of ALL locale variants so we don't duplicate even if locale changed
  const allNameVariants = new Set<string>();
  for (const action of DEFAULT_ACTIONS) {
    for (const val of Object.values(action.name)) {
      allNameVariants.add(val.toLowerCase());
    }
  }

  const toCreate = DEFAULT_ACTIONS.filter((action) => {
    const localName = getActionName(action, locale).toLowerCase();
    // Skip if any locale variant of this default action already exists
    const anyVariantExists = Object.values(action.name).some((v) =>
      existingNames.has(v.toLowerCase())
    );
    return !anyVariantExists && !existingNames.has(localName);
  });

  if (toCreate.length === 0) return 0;

  await prisma.action.createMany({
    data: toCreate.map((action) => ({
      name: getActionName(action, locale),
      block: action.block,
      xp: action.xp,
      difficulty: action.difficulty,
      userId,
    })),
    skipDuplicates: true,
  });

  return toCreate.length;
}
