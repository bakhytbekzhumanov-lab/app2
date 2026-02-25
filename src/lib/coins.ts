export const STREAK_BONUSES: { days: number; coins: number }[] = [
  { days: 3, coins: 10 },
  { days: 7, coins: 30 },
  { days: 14, coins: 75 },
  { days: 30, coins: 200 },
  { days: 100, coins: 500 },
  { days: 365, coins: 2000 },
];

export function getStreakBonus(streak: number): number | null {
  const bonus = STREAK_BONUSES.find((b) => b.days === streak);
  return bonus ? bonus.coins : null;
}
