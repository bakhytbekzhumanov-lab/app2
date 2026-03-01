/**
 * 4 default actions per each of the 8 blocks = 32 actions total.
 * Created for every user (existing + new on register).
 * Names are localized: en / ru / kz.
 *
 * These are ADDITIONAL actions — intentionally different
 * from the ones in prisma/seed.ts to avoid duplicates.
 */

export interface DefaultAction {
  name: Record<string, string>; // locale → localised name
  block:
    | "HEALTH"
    | "WORK"
    | "DEVELOPMENT"
    | "RELATIONSHIPS"
    | "FINANCE"
    | "SPIRITUALITY"
    | "BRIGHTNESS"
    | "HOME";
  xp: number;
  difficulty: "EASY" | "NORMAL" | "HARD" | "VERY_HARD" | "LEGENDARY";
}

export const DEFAULT_ACTIONS: DefaultAction[] = [
  // ─── HEALTH ──────────────────────────────────────
  {
    name: { en: "Cold shower", ru: "Контрастный душ", kz: "Салқын душ" },
    block: "HEALTH",
    xp: 12,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Take vitamins", ru: "Принять витамины", kz: "Витамин қабылдау" },
    block: "HEALTH",
    xp: 3,
    difficulty: "EASY",
  },
  {
    name: { en: "Yoga session", ru: "Йога сессия", kz: "Йога сабағы" },
    block: "HEALTH",
    xp: 15,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Track calories", ru: "Подсчёт калорий", kz: "Калорияны есептеу" },
    block: "HEALTH",
    xp: 5,
    difficulty: "EASY",
  },

  // ─── WORK ────────────────────────────────────────
  {
    name: { en: "Plan tomorrow", ru: "Спланировать завтра", kz: "Ертеңді жоспарлау" },
    block: "WORK",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "Review tasks", ru: "Обзор задач", kz: "Тапсырмаларды тексеру" },
    block: "WORK",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "Learn a work tool", ru: "Изучить рабочий инструмент", kz: "Жұмыс құралын үйрену" },
    block: "WORK",
    xp: 15,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Networking", ru: "Нетворкинг", kz: "Нетворкинг" },
    block: "WORK",
    xp: 10,
    difficulty: "NORMAL",
  },

  // ─── DEVELOPMENT ─────────────────────────────────
  {
    name: { en: "Watch a TED talk", ru: "Посмотреть TED talk", kz: "TED talk көру" },
    block: "DEVELOPMENT",
    xp: 8,
    difficulty: "EASY",
  },
  {
    name: { en: "Solve a puzzle", ru: "Решить головоломку", kz: "Жұмбақ шешу" },
    block: "DEVELOPMENT",
    xp: 8,
    difficulty: "EASY",
  },
  {
    name: { en: "Write study notes", ru: "Написать конспект", kz: "Конспект жазу" },
    block: "DEVELOPMENT",
    xp: 10,
    difficulty: "EASY",
  },
  {
    name: { en: "Listen to a podcast", ru: "Послушать подкаст", kz: "Подкаст тыңдау" },
    block: "DEVELOPMENT",
    xp: 8,
    difficulty: "EASY",
  },

  // ─── RELATIONSHIPS ───────────────────────────────
  {
    name: { en: "Text someone you care about", ru: "Написать близкому человеку", kz: "Жақын адамға хат жазу" },
    block: "RELATIONSHIPS",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "Give a compliment", ru: "Сделать комплимент", kz: "Мақтау айту" },
    block: "RELATIONSHIPS",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "Quality time with family", ru: "Время с семьёй", kz: "Отбасымен уақыт" },
    block: "RELATIONSHIPS",
    xp: 15,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Forgive and let go", ru: "Простить обиду", kz: "Кешіру" },
    block: "RELATIONSHIPS",
    xp: 20,
    difficulty: "HARD",
  },

  // ─── FINANCE ─────────────────────────────────────
  {
    name: { en: "Track expenses", ru: "Записать расходы", kz: "Шығындарды жазу" },
    block: "FINANCE",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "No-spend day", ru: "День без трат", kz: "Шығынсыз күн" },
    block: "FINANCE",
    xp: 10,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Financial planning", ru: "Финансовый план", kz: "Қаржылық жоспар" },
    block: "FINANCE",
    xp: 20,
    difficulty: "HARD",
  },
  {
    name: { en: "Compare prices", ru: "Сравнить цены", kz: "Бағаларды салыстыру" },
    block: "FINANCE",
    xp: 5,
    difficulty: "EASY",
  },

  // ─── SPIRITUALITY ────────────────────────────────
  {
    name: { en: "Digital detox (1 hour)", ru: "Цифровой детокс (1ч)", kz: "Сандық детокс (1 сағ)" },
    block: "SPIRITUALITY",
    xp: 10,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Prayer", ru: "Помолиться", kz: "Намаз оқу" },
    block: "SPIRITUALITY",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "Affirmations", ru: "Аффирмации", kz: "Аффирмациялар" },
    block: "SPIRITUALITY",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "Read a spiritual book", ru: "Читать духовную книгу", kz: "Рухани кітап оқу" },
    block: "SPIRITUALITY",
    xp: 10,
    difficulty: "NORMAL",
  },

  // ─── BRIGHTNESS ──────────────────────────────────
  {
    name: { en: "Visit a new place", ru: "Посетить новое место", kz: "Жаңа жерге бару" },
    block: "BRIGHTNESS",
    xp: 15,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Take photos", ru: "Сделать фотографии", kz: "Фото түсіру" },
    block: "BRIGHTNESS",
    xp: 8,
    difficulty: "EASY",
  },
  {
    name: { en: "Play a game", ru: "Поиграть в игру", kz: "Ойын ойнау" },
    block: "BRIGHTNESS",
    xp: 8,
    difficulty: "EASY",
  },
  {
    name: { en: "Try a new recipe", ru: "Попробовать новый рецепт", kz: "Жаңа рецепт сынау" },
    block: "BRIGHTNESS",
    xp: 12,
    difficulty: "NORMAL",
  },

  // ─── HOME ────────────────────────────────────────
  {
    name: { en: "Water the plants", ru: "Полить цветы", kz: "Гүлдерді суару" },
    block: "HOME",
    xp: 3,
    difficulty: "EASY",
  },
  {
    name: { en: "Declutter desk", ru: "Убрать рабочий стол", kz: "Жұмыс үстелін жинау" },
    block: "HOME",
    xp: 5,
    difficulty: "EASY",
  },
  {
    name: { en: "Fix something at home", ru: "Починить что-то дома", kz: "Үйде бірдеңе жөндеу" },
    block: "HOME",
    xp: 15,
    difficulty: "NORMAL",
  },
  {
    name: { en: "Grocery shopping", ru: "Закупка продуктов", kz: "Азық-түлік сатып алу" },
    block: "HOME",
    xp: 10,
    difficulty: "NORMAL",
  },
];

/**
 * Returns the localised name for an action, falling back to English.
 */
export function getActionName(action: DefaultAction, locale: string): string {
  return action.name[locale] || action.name.en || Object.values(action.name)[0];
}
