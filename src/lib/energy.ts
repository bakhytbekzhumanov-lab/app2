/* ──── Energy Points System ──── */

export const MAX_ENERGY = 100;
export const MIN_ENERGY = -20; // overdraft limit
export const BURNOUT_THRESHOLD_DAYS = 3; // consecutive overdraft days
export const BURNOUT_DURATION_DAYS = 2;
export const BURNOUT_PENALTY = 0.5; // 50% cap during burnout

// Morning input maxes (each 0–100, weighted to form total energy)
export const SLEEP_MAX = 100;
export const PHYSICAL_MAX = 100;
export const MENTAL_MAX = 100;

// Weights for each component (must sum to 1.0)
export const SLEEP_WEIGHT = 0.4;
export const PHYSICAL_WEIGHT = 0.3;
export const MENTAL_WEIGHT = 0.3;

// Calculate weighted energy from raw scores (each 0–100)
export function calcBaseEnergy(sleep: number, physical: number, mental: number): number {
  return Math.round(sleep * SLEEP_WEIGHT + physical * PHYSICAL_WEIGHT + mental * MENTAL_WEIGHT);
}

// Energy costs by difficulty
export const ENERGY_COSTS: Record<string, number> = {
  EASY: 5,
  NORMAL: 10,
  HARD: 20,
  VERY_HARD: 35,
  LEGENDARY: 60,
};

// Kanban energy cost based on scores (importance * discomfort * urgency)
export function calcKanbanEnergyCost(importance: number, discomfort: number, urgency: number): number {
  const score = (importance + discomfort + urgency) / 3;
  if (score <= 3) return 5;
  if (score <= 5) return 10;
  if (score <= 7) return 20;
  return 35;
}

// Recovery actions
export interface RecoveryType {
  type: string;
  label: Record<string, string>;
  ep: number;
  maxPerDay: number;
  icon: string;
}

export const RECOVERY_TYPES: RecoveryType[] = [
  { type: "POWER_NAP", label: { ru: "Дневной сон", en: "Power Nap", kz: "Күндізгі ұйқы" }, ep: 12, maxPerDay: 1, icon: "😴" },
  { type: "TEA_BREAK", label: { ru: "Чайная пауза", en: "Tea Break", kz: "Шай үзіліс" }, ep: 5, maxPerDay: 3, icon: "☕" },
  { type: "PRAYER", label: { ru: "Намаз / молитва", en: "Prayer", kz: "Намаз" }, ep: 8, maxPerDay: 5, icon: "🤲" },
  { type: "MUSIC", label: { ru: "Музыка", en: "Music", kz: "Музыка" }, ep: 3, maxPerDay: 99, icon: "🎵" },
  { type: "WALK", label: { ru: "Прогулка", en: "Walk", kz: "Серуен" }, ep: 10, maxPerDay: 2, icon: "🚶" },
  { type: "QUEST_COMPLETE", label: { ru: "Квест завершён", en: "Quest Complete", kz: "Квест аяқталды" }, ep: 5, maxPerDay: 99, icon: "⚔️" },
];

// Streak bonuses
export function calcStreakBonus(sleepStreak: number, routineStreak: number): number {
  let bonus = 0;
  if (sleepStreak >= 5) bonus += 5;
  if (routineStreak >= 3) bonus += 10;
  return bonus;
}

// Energy color thresholds
export function getEnergyColor(current: number, base: number): string {
  if (current <= 0) return "#a855f7"; // purple - overdraft
  const pct = (current / Math.max(base, 1)) * 100;
  if (pct >= 70) return "#22c55e"; // green
  if (pct >= 40) return "#eab308"; // amber
  if (pct >= 20) return "#f97316"; // orange
  return "#ef4444"; // red
}

export function getEnergyLabel(current: number, base: number, locale: string): string {
  if (current <= 0) {
    return locale === "ru" ? "Овердрафт" : locale === "kz" ? "Овердрафт" : "Overdraft";
  }
  const pct = (current / Math.max(base, 1)) * 100;
  if (pct >= 70) return locale === "ru" ? "Отлично" : locale === "kz" ? "Тамаша" : "Great";
  if (pct >= 40) return locale === "ru" ? "Нормально" : locale === "kz" ? "Қалыпты" : "Normal";
  if (pct >= 20) return locale === "ru" ? "Низко" : locale === "kz" ? "Төмен" : "Low";
  return locale === "ru" ? "Критично" : locale === "kz" ? "Сыни" : "Critical";
}

// Check if currently in burnout
export function checkBurnout(consecutiveOverdraftDays: number): boolean {
  return consecutiveOverdraftDays >= BURNOUT_THRESHOLD_DAYS;
}
