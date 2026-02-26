export interface HabitLevelInfo {
  level: number;
  title: string;
  minCompletions: number;
  maxCompletions: number;
  progress: number;
  xpMultiplier: number;
}

const LEVELS = [
  { level: 1, title: "Beginner",   min: 0,   max: 6   },
  { level: 2, title: "Apprentice", min: 7,   max: 20  },
  { level: 3, title: "Regular",    min: 21,  max: 49  },
  { level: 4, title: "Committed",  min: 50,  max: 99  },
  { level: 5, title: "Dedicated",  min: 100, max: 199 },
  { level: 6, title: "Master",     min: 200, max: 364 },
  { level: 7, title: "Legend",     min: 365, max: -1  },
];

export function getHabitLevel(totalCompletions: number): HabitLevelInfo {
  for (const lvl of LEVELS) {
    if (lvl.max === -1 || totalCompletions <= lvl.max) {
      const rangeSize = lvl.max === -1 ? 365 : lvl.max - lvl.min + 1;
      const progress = lvl.max === -1 ? 1 : (totalCompletions - lvl.min) / rangeSize;
      return {
        level: lvl.level,
        title: lvl.title,
        minCompletions: lvl.min,
        maxCompletions: lvl.max,
        progress: Math.min(progress, 1),
        xpMultiplier: 1 + lvl.level * 0.1,
      };
    }
  }
  return {
    level: 7, title: "Legend", minCompletions: 365,
    maxCompletions: -1, progress: 1, xpMultiplier: 1.7,
  };
}

export const HABIT_LEVEL_TITLES: Record<string, Record<number, string>> = {
  ru: { 1: "Новичок", 2: "Ученик", 3: "Обычный", 4: "Преданный", 5: "Посвящённый", 6: "Мастер", 7: "Легенда" },
  en: { 1: "Beginner", 2: "Apprentice", 3: "Regular", 4: "Committed", 5: "Dedicated", 6: "Master", 7: "Legend" },
  kz: { 1: "Жаңадан", 2: "Шәкірт", 3: "Тұрақты", 4: "Адал", 5: "Берілген", 6: "Шебер", 7: "Аңыз" },
};
