import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed Caps
  const caps = [
    { block: "HEALTH" as const, value: 100 },
    { block: "WORK" as const, value: 120 },
    { block: "DEVELOPMENT" as const, value: 80 },
    { block: "RELATIONSHIPS" as const, value: 60 },
    { block: "FINANCE" as const, value: 60 },
    { block: "SPIRITUALITY" as const, value: 60 },
    { block: "BRIGHTNESS" as const, value: 60 },
    { block: "HOME" as const, value: 80 },
  ];

  for (const cap of caps) {
    await prisma.cap.upsert({
      where: { block: cap.block },
      update: { value: cap.value },
      create: cap,
    });
  }
  console.log("Caps seeded");

  // Seed Achievements
  const achievements = [
    { code: "streak_3", name: "Getting Started", description: "3-day streak", icon: "🔥", condition: '{"type":"streak","value":3}', xpReward: 20, coinReward: 10 },
    { code: "streak_7", name: "Week Warrior", description: "7-day streak", icon: "🔥", condition: '{"type":"streak","value":7}', xpReward: 50, coinReward: 30 },
    { code: "streak_30", name: "Monthly Master", description: "30-day streak", icon: "🔥", condition: '{"type":"streak","value":30}', xpReward: 200, coinReward: 200 },
    { code: "streak_100", name: "Centurion", description: "100-day streak", icon: "💎", condition: '{"type":"streak","value":100}', xpReward: 500, coinReward: 500 },
    { code: "streak_365", name: "Legendary Commitment", description: "365-day streak", icon: "👑", condition: '{"type":"streak","value":365}', xpReward: 2000, coinReward: 2000 },
    { code: "level_5", name: "Rising Star", description: "Reach level 5", icon: "⭐", condition: '{"type":"level","value":5}', xpReward: 100, coinReward: 50 },
    { code: "level_10", name: "Veteran", description: "Reach level 10", icon: "🌟", condition: '{"type":"level","value":10}', xpReward: 300, coinReward: 150 },
    { code: "level_25", name: "Apex Legend", description: "Reach max level", icon: "👑", condition: '{"type":"level","value":25}', xpReward: 1000, coinReward: 1000 },
    { code: "first_action", name: "First Step", description: "Log your first action", icon: "👣", condition: '{"type":"actions","value":1}', xpReward: 10, coinReward: 5 },
    { code: "actions_100", name: "Action Hero", description: "Log 100 actions", icon: "💪", condition: '{"type":"actions","value":100}', xpReward: 100, coinReward: 50 },
    { code: "actions_1000", name: "Thousand Acts", description: "Log 1000 actions", icon: "🏆", condition: '{"type":"actions","value":1000}', xpReward: 500, coinReward: 250 },
    { code: "all_blocks", name: "Balance Seeker", description: "All 8 blocks > 0% in one week", icon: "⚖️", condition: '{"type":"allBlocks","value":1}', xpReward: 100, coinReward: 40 },
    { code: "perfect_balance", name: "Perfect Balance", description: "All 8 blocks > 50% in one week", icon: "🎯", condition: '{"type":"allBlocks","value":50}', xpReward: 300, coinReward: 150 },
    { code: "habit_lv5", name: "Habit Master", description: "Any habit reaches level 5", icon: "🔁", condition: '{"type":"habitLevel","value":5}', xpReward: 100, coinReward: 50 },
    { code: "habit_lv10", name: "Habit Legend", description: "Any habit reaches level 10", icon: "🔁", condition: '{"type":"habitLevel","value":10}', xpReward: 300, coinReward: 150 },
    { code: "kanban_first", name: "Task Crusher", description: "Complete first Kanban task", icon: "📋", condition: '{"type":"kanbanDone","value":1}', xpReward: 10, coinReward: 5 },
    { code: "kanban_50", name: "Productivity Machine", description: "Complete 50 Kanban tasks", icon: "⚡", condition: '{"type":"kanbanDone","value":50}', xpReward: 200, coinReward: 100 },
    { code: "perfect_day", name: "Perfect Day", description: "All habits done + main task done", icon: "💯", condition: '{"type":"perfectDay","value":1}', xpReward: 50, coinReward: 15 },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: { name: a.name, description: a.description, icon: a.icon, condition: a.condition, xpReward: a.xpReward, coinReward: a.coinReward },
      create: a,
    });
  }
  console.log("Achievements seeded");

  // Seed test user (dev only)
  if (process.env.NODE_ENV !== "production") {
    const passwordHash = await bcrypt.hash("test123", 12);
    const testUser = await prisma.user.upsert({
      where: { email: "test@life-rpg.com" },
      update: {},
      create: {
        email: "test@life-rpg.com",
        name: "Test User",
        nickname: "tester",
        passwordHash,
        avatarStage: 1,
        totalXp: 0,
        totalCoins: 50,
        locale: "ru",
      },
    });

    // Seed default actions for test user
    const defaultActions = [
      { name: "Утренняя пробежка", block: "HEALTH" as const, xp: 15, difficulty: "NORMAL" as const },
      { name: "Тренировка в зале", block: "HEALTH" as const, xp: 25, difficulty: "HARD" as const },
      { name: "Зарядка", block: "HEALTH" as const, xp: 8, difficulty: "EASY" as const },
      { name: "Пить 2л воды", block: "HEALTH" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Здоровый завтрак", block: "HEALTH" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Растяжка 15 мин", block: "HEALTH" as const, xp: 8, difficulty: "EASY" as const },
      { name: "Подготовить урок", block: "WORK" as const, xp: 10, difficulty: "NORMAL" as const },
      { name: "Проверить домашку", block: "WORK" as const, xp: 8, difficulty: "EASY" as const },
      { name: "Рабочий созвон", block: "WORK" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Deep work сессия", block: "WORK" as const, xp: 20, difficulty: "HARD" as const },
      { name: "Отчёт за неделю", block: "WORK" as const, xp: 15, difficulty: "NORMAL" as const },
      { name: "Провести урок", block: "WORK" as const, xp: 12, difficulty: "NORMAL" as const },
      { name: "Читать книгу 30 мин", block: "DEVELOPMENT" as const, xp: 10, difficulty: "EASY" as const },
      { name: "Онлайн-курс урок", block: "DEVELOPMENT" as const, xp: 15, difficulty: "NORMAL" as const },
      { name: "Практика кода 1ч", block: "DEVELOPMENT" as const, xp: 20, difficulty: "NORMAL" as const },
      { name: "Написать статью", block: "DEVELOPMENT" as const, xp: 30, difficulty: "HARD" as const },
      { name: "Новый навык изучить", block: "DEVELOPMENT" as const, xp: 25, difficulty: "HARD" as const },
      { name: "Позвонить другу", block: "RELATIONSHIPS" as const, xp: 8, difficulty: "EASY" as const },
      { name: "Семейный ужин", block: "RELATIONSHIPS" as const, xp: 15, difficulty: "NORMAL" as const },
      { name: "Дата с партнёром", block: "RELATIONSHIPS" as const, xp: 20, difficulty: "NORMAL" as const },
      { name: "Помочь родителям", block: "RELATIONSHIPS" as const, xp: 15, difficulty: "NORMAL" as const },
      { name: "Встреча с друзьями", block: "RELATIONSHIPS" as const, xp: 12, difficulty: "EASY" as const },
      { name: "Проверить бюджет", block: "FINANCE" as const, xp: 10, difficulty: "NORMAL" as const },
      { name: "Отложить на накопления", block: "FINANCE" as const, xp: 15, difficulty: "NORMAL" as const },
      { name: "Изучить инвестиции", block: "FINANCE" as const, xp: 20, difficulty: "HARD" as const },
      { name: "Оплатить счета", block: "FINANCE" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Утренний намаз", block: "SPIRITUALITY" as const, xp: 8, difficulty: "EASY" as const },
      { name: "Чтение Корана", block: "SPIRITUALITY" as const, xp: 10, difficulty: "EASY" as const },
      { name: "Медитация 15 мин", block: "SPIRITUALITY" as const, xp: 10, difficulty: "NORMAL" as const },
      { name: "Благодарность (журнал)", block: "SPIRITUALITY" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Дуа перед сном", block: "SPIRITUALITY" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Хобби 1 час", block: "BRIGHTNESS" as const, xp: 12, difficulty: "EASY" as const },
      { name: "Творческий проект", block: "BRIGHTNESS" as const, xp: 20, difficulty: "NORMAL" as const },
      { name: "Прогулка на природе", block: "BRIGHTNESS" as const, xp: 10, difficulty: "EASY" as const },
      { name: "Посмотреть кино", block: "BRIGHTNESS" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Музыка / рисование", block: "BRIGHTNESS" as const, xp: 15, difficulty: "NORMAL" as const },
      { name: "Застелить кровать", block: "HOME" as const, xp: 3, difficulty: "EASY" as const },
      { name: "Пропылесосить", block: "HOME" as const, xp: 8, difficulty: "NORMAL" as const },
      { name: "Приготовить обед", block: "HOME" as const, xp: 12, difficulty: "NORMAL" as const },
      { name: "Помыть посуду", block: "HOME" as const, xp: 5, difficulty: "EASY" as const },
      { name: "Глубокая уборка кухни", block: "HOME" as const, xp: 35, difficulty: "LEGENDARY" as const },
      { name: "Стирка и глажка", block: "HOME" as const, xp: 10, difficulty: "NORMAL" as const },
      { name: "Разобрать шкаф", block: "HOME" as const, xp: 20, difficulty: "HARD" as const },
    ];

    for (const action of defaultActions) {
      const existing = await prisma.action.findFirst({
        where: { name: action.name, userId: testUser.id },
      });
      if (!existing) {
        await prisma.action.create({
          data: { ...action, userId: testUser.id },
        });
      }
    }
    console.log("Test user and default actions seeded");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
