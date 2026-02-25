import type { Block, Difficulty, TaskOwner, KanbanStatus, HabitFrequency } from "@prisma/client";

export type { Block, Difficulty, TaskOwner, KanbanStatus, HabitFrequency };

export interface LevelInfo {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
}

export interface BlockConfig {
  key: Block;
  color: string;
  icon: string;
  labelRu: string;
  labelEn: string;
  labelKz: string;
}

export interface WeeklyBlockData {
  block: Block;
  xp: number;
  cap: number;
  percentage: number;
  trend: "up" | "down" | "same";
}

export interface DailyStats {
  xpToday: number;
  actionsToday: number;
  habitsToday: number;
}

export const BLOCK_COLORS: Record<Block, string> = {
  HEALTH: "#ef4444",
  WORK: "#f59e0b",
  DEVELOPMENT: "#8b5cf6",
  RELATIONSHIPS: "#ec4899",
  FINANCE: "#06b6d4",
  SPIRITUALITY: "#a78bfa",
  BRIGHTNESS: "#f97316",
  HOME: "#22c55e",
};

export const BLOCK_ICONS: Record<Block, string> = {
  HEALTH: "\u{1F4AA}",
  WORK: "\u{1F9F1}",
  DEVELOPMENT: "\u{1F4DA}",
  RELATIONSHIPS: "\u{1F495}",
  FINANCE: "\u{1F4B0}",
  SPIRITUALITY: "\u{1F54C}",
  BRIGHTNESS: "\u2728",
  HOME: "\u{1F3E0}",
};

export const DIFFICULTY_XP_MULTIPLIER: Record<Difficulty, number> = {
  EASY: 1,
  NORMAL: 1.5,
  HARD: 2,
  VERY_HARD: 3,
  LEGENDARY: 5,
};

export const DEFAULT_CAPS: Record<Block, number> = {
  HEALTH: 100,
  WORK: 120,
  DEVELOPMENT: 80,
  RELATIONSHIPS: 60,
  FINANCE: 60,
  SPIRITUALITY: 60,
  BRIGHTNESS: 60,
  HOME: 80,
};
