import type { Block, HabitFrequency } from "@prisma/client";

export interface SuggestedHabit {
  name: Record<string, string>;
  block: Block;
  frequency: HabitFrequency;
  xpPerLog: number;
  negativeIfSkip: Record<string, string>;
  positiveIfDone: Record<string, string>;
}

export function getLocalized(obj: Record<string, string>, locale: string): string {
  return obj[locale] || obj.en || Object.values(obj)[0];
}

export const SUGGESTED_HABITS: SuggestedHabit[] = [
  // HEALTH
  {
    name: { ru: "Утренняя зарядка", en: "Morning Exercise", kz: "Таңғы жаттығу" },
    block: "HEALTH", frequency: "DAILY", xpPerLog: 20,
    negativeIfSkip: { ru: "Вялость и низкая энергия", en: "Lethargy and low energy", kz: "Сылбырлық және төмен энергия" },
    positiveIfDone: { ru: "Бодрость на весь день", en: "Energy for the whole day", kz: "Күні бойы серпінді" },
  },
  {
    name: { ru: "Выпить 2л воды", en: "Drink 2L of Water", kz: "2 л су ішу" },
    block: "HEALTH", frequency: "DAILY", xpPerLog: 10,
    negativeIfSkip: { ru: "Обезвоживание, головная боль", en: "Dehydration, headaches", kz: "Сусыздану, бас ауруы" },
    positiveIfDone: { ru: "Чистая кожа, ясный ум", en: "Clear skin, sharp mind", kz: "Таза тері, анық ой" },
  },
  {
    name: { ru: "Сон до 23:00", en: "Sleep by 11 PM", kz: "23:00-ге дейін ұйықтау" },
    block: "HEALTH", frequency: "DAILY", xpPerLog: 15,
    negativeIfSkip: { ru: "Усталость, низкая продуктивность", en: "Fatigue, low productivity", kz: "Шаршау, төмен өнімділік" },
    positiveIfDone: { ru: "Полное восстановление", en: "Full recovery", kz: "Толық қалпына келу" },
  },
  // WORK
  {
    name: { ru: "Deep work 2 часа", en: "2 Hours Deep Work", kz: "2 сағат терең жұмыс" },
    block: "WORK", frequency: "WEEKDAYS", xpPerLog: 25,
    negativeIfSkip: { ru: "Накопление задач", en: "Task buildup", kz: "Тапсырмалар жиналуы" },
    positiveIfDone: { ru: "Прогресс по главному проекту", en: "Progress on main project", kz: "Басты жобада ілгерілеу" },
  },
  {
    name: { ru: "Планирование дня", en: "Day Planning", kz: "Күнді жоспарлау" },
    block: "WORK", frequency: "DAILY", xpPerLog: 10,
    negativeIfSkip: { ru: "Хаотичный день", en: "Chaotic day", kz: "Ретсіз күн" },
    positiveIfDone: { ru: "Фокус и контроль", en: "Focus and control", kz: "Фокус және бақылау" },
  },
  {
    name: { ru: "Inbox Zero", en: "Inbox Zero", kz: "Inbox Zero" },
    block: "WORK", frequency: "WEEKDAYS", xpPerLog: 10,
    negativeIfSkip: { ru: "Пропущенные письма", en: "Missed emails", kz: "Жіберілген хаттар" },
    positiveIfDone: { ru: "Чистый разум", en: "Clear mind", kz: "Таза ой" },
  },
  // DEVELOPMENT
  {
    name: { ru: "Чтение 20 минут", en: "20 Min Reading", kz: "20 минут оқу" },
    block: "DEVELOPMENT", frequency: "DAILY", xpPerLog: 15,
    negativeIfSkip: { ru: "Стагнация мышления", en: "Mental stagnation", kz: "Ой тоқырауы" },
    positiveIfDone: { ru: "Новые идеи и знания", en: "New ideas and knowledge", kz: "Жаңа идеялар мен білім" },
  },
  {
    name: { ru: "Изучение нового навыка", en: "Learn a New Skill", kz: "Жаңа дағды үйрену" },
    block: "DEVELOPMENT", frequency: "THREE_PER_WEEK", xpPerLog: 20,
    negativeIfSkip: { ru: "Отставание от рынка", en: "Falling behind the market", kz: "Нарықтан қалу" },
    positiveIfDone: { ru: "Рост компетенций", en: "Growing competencies", kz: "Құзыреттілік өсуі" },
  },
  {
    name: { ru: "Ведение дневника", en: "Journaling", kz: "Күнделік жүргізу" },
    block: "DEVELOPMENT", frequency: "DAILY", xpPerLog: 10,
    negativeIfSkip: { ru: "Нет рефлексии", en: "No self-reflection", kz: "Рефлексия жоқ" },
    positiveIfDone: { ru: "Ясность мышления", en: "Mental clarity", kz: "Ой анықтығы" },
  },
  // RELATIONSHIPS
  {
    name: { ru: "Позвонить близким", en: "Call Loved Ones", kz: "Жақындарға қоңырау шалу" },
    block: "RELATIONSHIPS", frequency: "THREE_PER_WEEK", xpPerLog: 15,
    negativeIfSkip: { ru: "Отдаление от близких", en: "Drifting from loved ones", kz: "Жақындардан алыстау" },
    positiveIfDone: { ru: "Тёплые отношения", en: "Warm relationships", kz: "Жылы қарым-қатынас" },
  },
  {
    name: { ru: "Качественное время с семьёй", en: "Quality Family Time", kz: "Отбасымен сапалы уақыт" },
    block: "RELATIONSHIPS", frequency: "DAILY", xpPerLog: 15,
    negativeIfSkip: { ru: "Отчуждение", en: "Alienation", kz: "Жатсыну" },
    positiveIfDone: { ru: "Крепкие связи", en: "Strong bonds", kz: "Мықты байланыстар" },
  },
  {
    name: { ru: "Благодарность (3 вещи)", en: "Gratitude (3 Things)", kz: "Алғыс (3 нәрсе)" },
    block: "RELATIONSHIPS", frequency: "DAILY", xpPerLog: 10,
    negativeIfSkip: { ru: "Фокус на негативе", en: "Focus on negatives", kz: "Теріске назар аудару" },
    positiveIfDone: { ru: "Позитивный настрой", en: "Positive mindset", kz: "Жағымды көңіл-күй" },
  },
  // FINANCE
  {
    name: { ru: "Запись расходов", en: "Track Expenses", kz: "Шығындарды жазу" },
    block: "FINANCE", frequency: "DAILY", xpPerLog: 10,
    negativeIfSkip: { ru: "Неконтролируемые траты", en: "Uncontrolled spending", kz: "Бақыланбайтын шығындар" },
    positiveIfDone: { ru: "Контроль бюджета", en: "Budget control", kz: "Бюджет бақылауы" },
  },
  {
    name: { ru: "Изучение инвестиций", en: "Study Investments", kz: "Инвестицияларды зерттеу" },
    block: "FINANCE", frequency: "THREE_PER_WEEK", xpPerLog: 15,
    negativeIfSkip: { ru: "Упущенные возможности", en: "Missed opportunities", kz: "Жіберілген мүмкіндіктер" },
    positiveIfDone: { ru: "Финансовая грамотность", en: "Financial literacy", kz: "Қаржылық сауаттылық" },
  },
  // SPIRITUALITY
  {
    name: { ru: "Медитация 10 мин", en: "10 Min Meditation", kz: "10 мин медитация" },
    block: "SPIRITUALITY", frequency: "DAILY", xpPerLog: 15,
    negativeIfSkip: { ru: "Стресс и тревога", en: "Stress and anxiety", kz: "Стресс және мазасыздық" },
    positiveIfDone: { ru: "Спокойствие и фокус", en: "Calm and focus", kz: "Тыныштық және фокус" },
  },
  {
    name: { ru: "Намаз / молитва", en: "Prayer", kz: "Намаз" },
    block: "SPIRITUALITY", frequency: "DAILY", xpPerLog: 20,
    negativeIfSkip: { ru: "Духовная пустота", en: "Spiritual emptiness", kz: "Рухани бостық" },
    positiveIfDone: { ru: "Внутренний покой", en: "Inner peace", kz: "Ішкі тыныштық" },
  },
  {
    name: { ru: "Прогулка на природе", en: "Nature Walk", kz: "Табиғатта серуендеу" },
    block: "SPIRITUALITY", frequency: "THREE_PER_WEEK", xpPerLog: 15,
    negativeIfSkip: { ru: "Выгорание", en: "Burnout", kz: "Күйіп кету" },
    positiveIfDone: { ru: "Перезагрузка", en: "Mental reset", kz: "Қайта жүктелу" },
  },
  // BRIGHTNESS
  {
    name: { ru: "Хобби 30 минут", en: "30 Min Hobby", kz: "30 мин хобби" },
    block: "BRIGHTNESS", frequency: "THREE_PER_WEEK", xpPerLog: 15,
    negativeIfSkip: { ru: "Серая рутина", en: "Dull routine", kz: "Сұр күнделікті" },
    positiveIfDone: { ru: "Радость и вдохновение", en: "Joy and inspiration", kz: "Қуаныш және шабыт" },
  },
  {
    name: { ru: "Новый опыт", en: "New Experience", kz: "Жаңа тәжірибе" },
    block: "BRIGHTNESS", frequency: "THREE_PER_WEEK", xpPerLog: 20,
    negativeIfSkip: { ru: "Скука и монотонность", en: "Boredom and monotony", kz: "Жалықу және біркелкілік" },
    positiveIfDone: { ru: "Яркие воспоминания", en: "Vivid memories", kz: "Жарқын естеліктер" },
  },
  // HOME
  {
    name: { ru: "Уборка 15 мин", en: "15 Min Cleaning", kz: "15 мин тазалау" },
    block: "HOME", frequency: "DAILY", xpPerLog: 10,
    negativeIfSkip: { ru: "Беспорядок и хаос", en: "Mess and chaos", kz: "Тәртіпсіздік" },
    positiveIfDone: { ru: "Чистое пространство", en: "Clean space", kz: "Таза кеңістік" },
  },
  {
    name: { ru: "Готовка здоровой еды", en: "Cook Healthy Meal", kz: "Пайдалы тамақ дайындау" },
    block: "HOME", frequency: "DAILY", xpPerLog: 15,
    negativeIfSkip: { ru: "Фастфуд и плохое питание", en: "Junk food and poor nutrition", kz: "Фастфуд және нашар тамақтану" },
    positiveIfDone: { ru: "Здоровье и экономия", en: "Health and savings", kz: "Денсаулық және үнемдеу" },
  },
  {
    name: { ru: "Разбор вещей", en: "Declutter", kz: "Заттарды сұрыптау" },
    block: "HOME", frequency: "THREE_PER_WEEK", xpPerLog: 10,
    negativeIfSkip: { ru: "Накопление хлама", en: "Clutter buildup", kz: "Заттардың жиналуы" },
    positiveIfDone: { ru: "Минимализм и порядок", en: "Minimalism and order", kz: "Минимализм және тәртіп" },
  },
];
