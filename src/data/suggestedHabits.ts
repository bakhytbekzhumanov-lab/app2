import type { Block, HabitFrequency } from "@prisma/client";

export interface SuggestedHabit {
  name: string;
  block: Block;
  frequency: HabitFrequency;
  xpPerLog: number;
  negativeIfSkip: string;
  positiveIfDone: string;
}

export const SUGGESTED_HABITS: SuggestedHabit[] = [
  // HEALTH
  { name: "Утренняя зарядка", block: "HEALTH", frequency: "DAILY", xpPerLog: 20, negativeIfSkip: "Вялость и низкая энергия", positiveIfDone: "Бодрость на весь день" },
  { name: "Выпить 2л воды", block: "HEALTH", frequency: "DAILY", xpPerLog: 10, negativeIfSkip: "Обезвоживание, головная боль", positiveIfDone: "Чистая кожа, ясный ум" },
  { name: "Сон до 23:00", block: "HEALTH", frequency: "DAILY", xpPerLog: 15, negativeIfSkip: "Усталость, низкая продуктивность", positiveIfDone: "Полное восстановление" },
  // WORK
  { name: "Deep work 2 часа", block: "WORK", frequency: "WEEKDAYS", xpPerLog: 25, negativeIfSkip: "Накопление задач", positiveIfDone: "Прогресс по главному проекту" },
  { name: "Планирование дня", block: "WORK", frequency: "DAILY", xpPerLog: 10, negativeIfSkip: "Хаотичный день", positiveIfDone: "Фокус и контроль" },
  { name: "Inbox Zero", block: "WORK", frequency: "WEEKDAYS", xpPerLog: 10, negativeIfSkip: "Пропущенные письма", positiveIfDone: "Чистый разум" },
  // DEVELOPMENT
  { name: "Чтение 20 минут", block: "DEVELOPMENT", frequency: "DAILY", xpPerLog: 15, negativeIfSkip: "Стагнация мышления", positiveIfDone: "Новые идеи и знания" },
  { name: "Изучение нового навыка", block: "DEVELOPMENT", frequency: "THREE_PER_WEEK", xpPerLog: 20, negativeIfSkip: "Отставание от рынка", positiveIfDone: "Рост компетенций" },
  { name: "Ведение дневника", block: "DEVELOPMENT", frequency: "DAILY", xpPerLog: 10, negativeIfSkip: "Нет рефлексии", positiveIfDone: "Ясность мышления" },
  // RELATIONSHIPS
  { name: "Позвонить близким", block: "RELATIONSHIPS", frequency: "THREE_PER_WEEK", xpPerLog: 15, negativeIfSkip: "Отдаление от близких", positiveIfDone: "Тёплые отношения" },
  { name: "Качественное время с семьёй", block: "RELATIONSHIPS", frequency: "DAILY", xpPerLog: 15, negativeIfSkip: "Отчуждение", positiveIfDone: "Крепкие связи" },
  { name: "Благодарность (3 вещи)", block: "RELATIONSHIPS", frequency: "DAILY", xpPerLog: 10, negativeIfSkip: "Фокус на негативе", positiveIfDone: "Позитивный настрой" },
  // FINANCE
  { name: "Запись расходов", block: "FINANCE", frequency: "DAILY", xpPerLog: 10, negativeIfSkip: "Неконтролируемые траты", positiveIfDone: "Контроль бюджета" },
  { name: "Изучение инвестиций", block: "FINANCE", frequency: "THREE_PER_WEEK", xpPerLog: 15, negativeIfSkip: "Упущенные возможности", positiveIfDone: "Финансовая грамотность" },
  // SPIRITUALITY
  { name: "Медитация 10 мин", block: "SPIRITUALITY", frequency: "DAILY", xpPerLog: 15, negativeIfSkip: "Стресс и тревога", positiveIfDone: "Спокойствие и фокус" },
  { name: "Намаз / молитва", block: "SPIRITUALITY", frequency: "DAILY", xpPerLog: 20, negativeIfSkip: "Духовная пустота", positiveIfDone: "Внутренний покой" },
  { name: "Прогулка на природе", block: "SPIRITUALITY", frequency: "THREE_PER_WEEK", xpPerLog: 15, negativeIfSkip: "Выгорание", positiveIfDone: "Перезагрузка" },
  // BRIGHTNESS
  { name: "Хобби 30 минут", block: "BRIGHTNESS", frequency: "THREE_PER_WEEK", xpPerLog: 15, negativeIfSkip: "Серая рутина", positiveIfDone: "Радость и вдохновение" },
  { name: "Новый опыт", block: "BRIGHTNESS", frequency: "THREE_PER_WEEK", xpPerLog: 20, negativeIfSkip: "Скука и монотонность", positiveIfDone: "Яркие воспоминания" },
  // HOME
  { name: "Уборка 15 мин", block: "HOME", frequency: "DAILY", xpPerLog: 10, negativeIfSkip: "Беспорядок и хаос", positiveIfDone: "Чистое пространство" },
  { name: "Готовка здоровой еды", block: "HOME", frequency: "DAILY", xpPerLog: 15, negativeIfSkip: "Фастфуд и плохое питание", positiveIfDone: "Здоровье и экономия" },
  { name: "Разбор вещей", block: "HOME", frequency: "THREE_PER_WEEK", xpPerLog: 10, negativeIfSkip: "Накопление хлама", positiveIfDone: "Минимализм и порядок" },
];
