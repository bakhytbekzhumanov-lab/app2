import type { LevelInfo } from "@/types";

const BASE_XP = 550;
const MAX_LEVEL = 25;

export function getLevel(totalXP: number): LevelInfo {
  let level = 1;
  let accumulated = 0;

  while (level < MAX_LEVEL) {
    const needed = BASE_XP * level;
    if (accumulated + needed > totalXP) {
      return {
        level,
        currentXP: totalXP - accumulated,
        nextLevelXP: needed,
        progress: (totalXP - accumulated) / needed,
      };
    }
    accumulated += needed;
    level++;
  }

  return { level: MAX_LEVEL, currentXP: 0, nextLevelXP: 0, progress: 1 };
}

export function calcKanbanXP(importance: number, discomfort: number, urgency: number): number {
  return Math.round((importance * discomfort * urgency) / 10);
}

export function getAvatarStage(level: number): number {
  return Math.min(level, MAX_LEVEL);
}

export const AVATAR_TITLES: Record<number, string> = {
  1: "Seedling",
  2: "Sprout",
  3: "Sapling",
  4: "Young Tree",
  5: "Tree",
  6: "Warrior",
  7: "Knight",
  8: "Guardian",
  9: "Champion",
  10: "Hero",
  11: "Sage",
  12: "Mystic",
  13: "Archon",
  14: "Legend",
  15: "Titan",
  16: "Cosmic",
  17: "Astral",
  18: "Nebula",
  19: "Galaxy",
  20: "Universe",
  21: "Transcendent",
  22: "Eternal",
  23: "Infinite",
  24: "Omega",
  25: "Apex",
};
