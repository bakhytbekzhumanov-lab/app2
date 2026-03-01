"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS } from "@/types";
import type { Block, HabitFrequency } from "@prisma/client";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Plus, Trash2, X, Check, Flame, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Archive, ChevronDown, Pencil, Eye
} from "lucide-react";
import { getHabitLevel, HABIT_LEVEL_TITLES } from "@/lib/habitLevels";
import { SUGGESTED_HABITS, getLocalized, type SuggestedHabit } from "@/data/suggestedHabits";
import { getHabitPraise } from "@/lib/celebration";

interface HabitLog { id: string; date: string; done: boolean; completed?: boolean; }
interface Habit {
  id: string;
  name: string;
  block: Block;
  frequency: HabitFrequency;
  xpPerLog: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  targetPerWeek: number;
  totalLogs: number;
  isActive: boolean;
  negativeIfSkip: string | null;
  positiveIfDone: string | null;
  logs: HabitLog[];
}

const BLOCKS: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];
const FREQUENCIES: HabitFrequency[] = ["DAILY", "WEEKDAYS", "THREE_PER_WEEK", "CUSTOM"];
const MAX_ACTIVE_HABITS = 4;

const FREQ_LABELS: Record<string, Record<HabitFrequency, string>> = {
  ru: { DAILY: "каждый день", WEEKDAYS: "будни", THREE_PER_WEEK: "3×/неделю", CUSTOM: "своё" },
  en: { DAILY: "per day", WEEKDAYS: "weekdays", THREE_PER_WEEK: "3×/week", CUSTOM: "custom" },
  kz: { DAILY: "күн сайын", WEEKDAYS: "жұмыс күн", THREE_PER_WEEK: "3×/апта", CUSTOM: "өзгеше" },
};

export default function HabitsPage() {
  const { t, locale } = useLocale();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState({ name: "", block: "HEALTH" as Block, frequency: "DAILY" as HabitFrequency, xpPerLog: 15, negativeIfSkip: "", positiveIfDone: "" });
  const [selectedBlock, setSelectedBlock] = useState<Block>("HEALTH");
  const [showArchived, setShowArchived] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const fetchHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (res.ok) setHabits(await res.json());
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const activeHabits = habits.filter((h) => h.isActive);
  const archivedHabits = habits.filter((h) => !h.isActive);
  const doneToday = activeHabits.filter((h) => isDoneToday(h, today)).length;

  const openCreate = () => {
    if (activeHabits.length >= MAX_ACTIVE_HABITS) {
      toast.error(locale === "ru"
        ? `Максимум ${MAX_ACTIVE_HABITS} активных привычки. Архивируйте одну, чтобы добавить новую.`
        : `Maximum ${MAX_ACTIVE_HABITS} active habits. Archive one to add a new one.`);
      return;
    }
    setEditingHabit(null);
    setForm({ name: "", block: "HEALTH", frequency: "DAILY", xpPerLog: 15, negativeIfSkip: "", positiveIfDone: "" });
    setModalOpen(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setForm({
      name: habit.name, block: habit.block, frequency: habit.frequency,
      xpPerLog: habit.xpPerLog, negativeIfSkip: habit.negativeIfSkip || "", positiveIfDone: habit.positiveIfDone || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const body: Record<string, unknown> = { ...form };
    if (!body.negativeIfSkip) delete body.negativeIfSkip;
    if (!body.positiveIfDone) delete body.positiveIfDone;

    if (editingHabit) {
      const res = await fetch(`/api/habits/${editingHabit.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) toast.success(locale === "ru" ? "Сохранено!" : "Saved!");
    } else {
      const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) toast.success(locale === "ru" ? "Привычка создана!" : "Habit created!");
    }
    setModalOpen(false);
    fetchHabits();
  };

  const addSuggestedHabit = async (sh: SuggestedHabit) => {
    if (activeHabits.length >= MAX_ACTIVE_HABITS) {
      toast.error(locale === "ru"
        ? `Максимум ${MAX_ACTIVE_HABITS} активных привычки. Архивируйте одну.`
        : `Maximum ${MAX_ACTIVE_HABITS} active habits. Archive one first.`);
      return;
    }
    const name = getLocalized(sh.name, locale);
    const negativeIfSkip = getLocalized(sh.negativeIfSkip, locale);
    const positiveIfDone = getLocalized(sh.positiveIfDone, locale);
    const res = await fetch("/api/habits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, block: sh.block, frequency: sh.frequency, xpPerLog: sh.xpPerLog, negativeIfSkip, positiveIfDone }),
    });
    if (res.ok) { toast.success(`${locale === "ru" ? "Добавлено" : "Added"}: ${name}`); fetchHabits(); }
  };

  const archiveHabit = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: false }) });
    toast.success(locale === "ru" ? "Привычка архивирована" : "Habit archived");
    fetchHabits();
  };

  const restoreHabit = async (id: string) => {
    if (activeHabits.length >= MAX_ACTIVE_HABITS) {
      toast.error(locale === "ru"
        ? `Максимум ${MAX_ACTIVE_HABITS} активных привычки. Архивируйте одну сначала.`
        : `Maximum ${MAX_ACTIVE_HABITS} active habits. Archive one first.`);
      return;
    }
    await fetch(`/api/habits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: true }) });
    toast.success(locale === "ru" ? "Привычка восстановлена" : "Habit restored");
    fetchHabits();
  };

  const deleteHabit = async (id: string) => {
    if (!confirm(locale === "ru" ? "Удалить привычку навсегда?" : "Delete habit permanently?")) return;
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    fetchHabits();
  };

  const toggleToday = async (habitId: string, prevLevel: number) => {
    const res = await fetch(`/api/habits/${habitId}/log`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today }) });
    if (res.ok) {
      const data = await res.json();
      if (data.xpAwarded > 0) {
        toast.success(`+${data.xpAwarded} XP`);
        setTimeout(() => toast(getHabitPraise(locale), { duration: 3000 }), 400);
      }
      if (data.newLevel && data.newLevel > prevLevel) {
        const title = HABIT_LEVEL_TITLES[locale]?.[data.newLevel] || data.levelTitle;
        toast.success(`⬆️ ${locale === "ru" ? "Уровень" : "Level"} ${data.newLevel}: ${title}!`);
      }
      fetchHabits();
    }
  };

  const existingNames = new Set(habits.map((h) => h.name));
  const filteredSuggestions = SUGGESTED_HABITS.filter((sh) => {
    const name = getLocalized(sh.name, locale);
    // Also check all locale variants in case habit was added in a different locale
    const allNames = Object.values(sh.name);
    return !existingNames.has(name) && !allNames.some((n) => existingNames.has(n)) && sh.block === selectedBlock;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.habits.title}</h1>
          <p className="text-sm text-text-dim mt-0.5">
            {locale === "ru" ? "Ежедневные ритуалы и отслеживание" : locale === "kz" ? "Күнделікті ритуалдар мен бақылау" : "Daily rituals and tracking"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            <Plus className="w-4 h-4" />
            {t.common.create}
          </button>
          <span className="text-sm font-mono text-text-dim">
            <span className="text-accent font-bold">{doneToday}</span>/{activeHabits.length}{" "}
            {locale === "ru" ? "сегодня" : locale === "kz" ? "бүгін" : "today"}
          </span>
        </div>
      </div>

      {/* MY HABITS */}
      {activeHabits.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-4">
            {locale === "ru" ? "Мои привычки" : locale === "kz" ? "Менің әдеттерім" : "My Habits"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} locale={locale} t={t} today={today}
                onToggle={() => toggleToday(habit.id, habit.level)}
                onEdit={() => openEdit(habit)}
                onArchive={() => archiveHabit(habit.id)}
                onDelete={() => deleteHabit(habit.id)} />
            ))}
          </div>
        </div>
      )}

      {activeHabits.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-text-dim">{t.common.noData}</p>
          <p className="text-xs text-text-dim mt-1">
            {locale === "ru" ? "Создайте привычку или выберите из рекомендуемых ниже" : "Create a habit or pick from recommendations below"}
          </p>
        </div>
      )}

      {/* RECOMMENDED HABITS */}
      <div>
        <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1 flex items-center gap-2">
          💡 {locale === "ru" ? "Рекомендуемые привычки" : locale === "kz" ? "Ұсынылған әдеттер" : "New Habit Recommendations"}
        </p>
        <p className="text-xs text-text-dim mb-3">
          {locale === "ru" ? "Нажмите на блок, чтобы увидеть рекомендации" : "Click a block to see recommendations"}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {BLOCKS.map((b) => (
            <button key={b} onClick={() => setSelectedBlock(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedBlock === b ? "text-white" : "bg-bg-elevated text-text-dim hover:text-text border border-border"}`}
              style={selectedBlock === b ? { backgroundColor: BLOCK_COLORS[b] } : undefined}>
              {t.blocks[b]}
            </button>
          ))}
        </div>
        {filteredSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {filteredSuggestions.map((sh) => {
              const name = getLocalized(sh.name, locale);
              const positive = getLocalized(sh.positiveIfDone, locale);
              const negative = getLocalized(sh.negativeIfSkip, locale);
              return (
                <div key={name} className="bg-bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[10px] text-text-dim mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: BLOCK_COLORS[sh.block] + "20", color: BLOCK_COLORS[sh.block] }}>
                      {t.blocks[sh.block]}
                    </span>
                    <span>⏱ {sh.xpPerLog}m</span>
                  </div>
                  <h4 className="text-sm font-medium mb-2">{name}</h4>
                  <div className="space-y-1 mb-3">
                    <div className="text-xs text-green-400/80 flex items-start gap-1.5">
                      <span className="flex-shrink-0">▲</span><span>{positive}</span>
                    </div>
                    <div className="text-xs text-red-400/70 flex items-start gap-1.5">
                      <span className="flex-shrink-0">▼</span><span>{negative}</span>
                    </div>
                  </div>
                  <button onClick={() => addSuggestedHabit(sh)}
                    className="text-xs text-accent hover:text-accent/80 font-medium transition-colors">
                    + {locale === "ru" ? "Добавить" : locale === "kz" ? "Қосу" : "Add Habit"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-dim py-4 text-center">
            {locale === "ru" ? "Все привычки этого блока уже добавлены!" : "All habits from this block are already added!"}
          </p>
        )}
      </div>

      {/* ARCHIVED */}
      {archivedHabits.length > 0 && (
        <div>
          <button onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs font-medium text-text-dim uppercase tracking-wider mb-3 hover:text-text transition-colors">
            <span>{locale === "ru" ? "Архив" : locale === "kz" ? "Мұрағат" : "Archived"}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showArchived ? "rotate-180" : ""}`} />
          </button>
          {showArchived && (
            <div className="flex flex-wrap gap-2">
              {archivedHabits.map((h) => (
                <div key={h.id} className="flex items-center gap-2 bg-bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <span>{h.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: BLOCK_COLORS[h.block] + "20", color: BLOCK_COLORS[h.block] }}>
                    {t.blocks[h.block]}
                  </span>
                  <button onClick={() => restoreHabit(h.id)}
                    className="text-xs text-accent hover:text-accent/80 font-medium ml-1 transition-colors">
                    {locale === "ru" ? "Восстановить" : "Restore"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">
                {editingHabit ? t.common.edit : t.habits.addHabit}
              </Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-mid mb-1 block">
                  {locale === "ru" ? "Название" : locale === "kz" ? "Атауы" : "Name"}
                </label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">{t.actions.block}</label>
                <select value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value as Block })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm">
                  {BLOCKS.map((b) => <option key={b} value={b}>{t.blocks[b]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">{t.habits.frequency}</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as HabitFrequency })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm">
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{t.habits[f === "DAILY" ? "daily" : f === "WEEKDAYS" ? "weekdays" : f === "THREE_PER_WEEK" ? "threePerWeek" : "custom"]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">
                  {t.common.xp} {locale === "ru" ? "за выполнение" : locale === "kz" ? "орындағанда" : "per completion"}
                </label>
                <input type="number" value={form.xpPerLog} onChange={(e) => setForm({ ...form, xpPerLog: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">
                  ▲ {locale === "ru" ? "Если сделать" : locale === "kz" ? "Жасаса" : "If done"}
                </label>
                <input value={form.positiveIfDone} onChange={(e) => setForm({ ...form, positiveIfDone: e.target.value })}
                  placeholder={locale === "ru" ? "Например: энергия, ясность" : "e.g. energy, clarity"}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">
                  ▼ {locale === "ru" ? "Если не сделать" : locale === "kz" ? "Жасамаса" : "If skipped"}
                </label>
                <input value={form.negativeIfSkip} onChange={(e) => setForm({ ...form, negativeIfSkip: e.target.value })}
                  placeholder={locale === "ru" ? "Например: вялость, стресс" : "e.g. sluggishness, stress"}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Dialog.Close className="flex-1 bg-bg-elevated border border-border rounded-lg py-2 text-sm">{t.common.cancel}</Dialog.Close>
              <button onClick={handleSave} className="flex-1 bg-accent text-bg rounded-lg py-2 text-sm font-medium hover:bg-accent/90">
                {editingHabit ? t.common.save : t.common.create}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/* ──── helpers ──── */
function isDoneToday(habit: Habit, today: string): boolean {
  return habit.logs.some((l) => {
    const d = new Date(l.date).toISOString().split("T")[0];
    return d === today && (l.done || l.completed);
  });
}

/* ──── Habit Card ──── */
function HabitCard({
  habit, locale, t, today, onToggle, onEdit, onArchive, onDelete,
}: {
  habit: Habit;
  locale: string;
  t: Record<string, Record<string, string>>;
  today: string;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const done = isDoneToday(habit, today);
  const totalLogs = habit.logs.filter((l) => l.done || l.completed).length;
  const levelInfo = getHabitLevel(totalLogs);
  const levelTitle = HABIT_LEVEL_TITLES[locale]?.[levelInfo.level] || levelInfo.title;
  const freqLabel = FREQ_LABELS[locale]?.[habit.frequency] || FREQ_LABELS.en[habit.frequency];
  const [showDetails, setShowDetails] = useState(false);

  // Weekly progress
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const logsThisWeek = habit.logs.filter((l) => {
    const d = new Date(l.date);
    return d >= weekStart && (l.done || l.completed);
  }).length;
  const weekTarget = habit.frequency === "DAILY" ? 7 : habit.frequency === "WEEKDAYS" ? 5 : habit.frequency === "THREE_PER_WEEK" ? 3 : (habit.targetPerWeek || 7);

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Top color bar */}
      <div className="h-1" style={{ backgroundColor: BLOCK_COLORS[habit.block] }} />
      <div className="p-4">
        {/* Name + Level */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm leading-tight">{habit.name}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-elevated border border-border font-mono flex-shrink-0 ml-2">
            Lv.{levelInfo.level}
          </span>
        </div>

        {/* Block · freq · XP */}
        <div className="flex items-center gap-1.5 text-[10px] text-text-dim mb-2">
          <span className="uppercase font-medium" style={{ color: BLOCK_COLORS[habit.block] }}>{t.blocks[habit.block]}</span>
          <span>·</span>
          <span>{freqLabel}</span>
          <span>·</span>
          <span>⏱ {habit.xpPerLog}m</span>
        </div>

        {/* Motivation ▲▼ */}
        {(habit.positiveIfDone || habit.negativeIfSkip) && (
          <div className="space-y-0.5 mb-2">
            {habit.positiveIfDone && (
              <div className="text-[11px] text-green-400/80 flex items-start gap-1">
                <span className="flex-shrink-0">▲</span><span className="line-clamp-1">{habit.positiveIfDone}</span>
              </div>
            )}
            {habit.negativeIfSkip && (
              <div className="text-[11px] text-red-400/70 flex items-start gap-1">
                <span className="flex-shrink-0">▼</span><span className="line-clamp-1">{habit.negativeIfSkip}</span>
              </div>
            )}
          </div>
        )}

        {/* Weekly progress bar */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min((logsThisWeek / weekTarget) * 100, 100)}%` }} />
          </div>
          <span className="text-[10px] font-mono text-text-dim">{logsThisWeek}/{weekTarget}</span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1 mb-2">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[11px] text-orange-400">
            {habit.currentStreak} {t.habits.streakDays}
          </span>
        </div>

        {/* Month Calendar */}
        <MonthCalendar logs={habit.logs} locale={locale} />

        {/* ── Action Buttons ── */}
        <div className="mt-3 space-y-2">
          {/* Main Log Button — Full Width */}
          <button onClick={onToggle}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              done ? "bg-accent/20 text-accent border border-accent/30" : "bg-accent text-bg hover:bg-accent/90"
            }`}>
            <Check className="w-4 h-4" />
            {done
              ? (locale === "ru" ? "Выполнено" : locale === "kz" ? "Орындалды" : "Done")
              : (locale === "ru" ? "Выполнить" : locale === "kz" ? "Орындау" : "Log")}
          </button>

          {/* Secondary Buttons */}
          <div className="flex gap-2">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-text-dim bg-bg-elevated border border-border hover:text-text transition-colors">
              <Pencil className="w-3 h-3" />
              {locale === "ru" ? "Ред." : locale === "kz" ? "Өзг." : "Edit"}
            </button>
            <button onClick={() => setShowDetails(!showDetails)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-text-dim bg-bg-elevated border border-border hover:text-text transition-colors">
              <Eye className="w-3 h-3" />
              {locale === "ru" ? "Детали" : locale === "kz" ? "Мәліметтер" : "Details"}
            </button>
          </div>
        </div>

        {/* Details (expandable) */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-dim">{locale === "ru" ? "Уровень" : "Level"}</span>
              <span className="text-accent font-medium">Lv.{levelInfo.level} — {levelTitle}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-dim">{locale === "ru" ? "Множитель XP" : "XP Multiplier"}</span>
              <span className="font-mono">×{levelInfo.xpMultiplier.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-dim">{locale === "ru" ? "До след. уровня" : "Next level"}</span>
              <span className="font-mono">{levelInfo.maxCompletions === -1 ? "MAX" : `${levelInfo.maxCompletions - totalLogs + 1}`}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-dim">{locale === "ru" ? "Лучшая серия" : "Best streak"}</span>
              <span className="font-mono">{habit.longestStreak}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-dim">{locale === "ru" ? "Всего выполнений" : "Total"}</span>
              <span className="font-mono">{totalLogs}</span>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={onArchive} className="flex items-center gap-1 text-xs text-text-dim hover:text-yellow-400 transition-colors">
                <Archive className="w-3 h-3" />{locale === "ru" ? "Архивировать" : "Archive"}
              </button>
              <button onClick={onDelete} className="flex items-center gap-1 text-xs text-text-dim hover:text-red-400 transition-colors">
                <Trash2 className="w-3 h-3" />{locale === "ru" ? "Удалить" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── Month Calendar with navigation + yearly modal ──── */
function MonthCalendar({ logs, locale }: { logs: HabitLog[]; locale: string }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [yearModalOpen, setYearModalOpen] = useState(false);

  const logMap = new Map<string, boolean>();
  logs.forEach((l) => {
    const d = new Date(l.date).toISOString().split("T")[0];
    if (l.done || l.completed) logMap.set(d, true);
  });

  const monthNames = locale === "kz"
    ? ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"]
    : locale === "en"
      ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      : ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

  const monthNamesFull = locale === "kz"
    ? ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"]
    : locale === "en"
      ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      : ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  const dayLabels = locale === "kz"
    ? ["Д", "С", "С", "Б", "Ж", "С", "Ж"]
    : locale === "en"
      ? ["M", "T", "W", "T", "F", "S", "S"]
      : ["П", "В", "С", "Ч", "П", "С", "В"];

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); } else setViewMonth(viewMonth + 1); };
  const prevYear = () => setViewYear(viewYear - 1);
  const nextYear = () => setViewYear(viewYear + 1);

  return (
    <>
      <div>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-0.5">
            <button onClick={prevYear} className="p-0.5 hover:text-accent transition-colors text-text-dim"><ChevronsLeft className="w-3 h-3" /></button>
            <button onClick={prevMonth} className="p-0.5 hover:text-accent transition-colors text-text-dim"><ChevronLeft className="w-3 h-3" /></button>
          </div>
          <button
            onClick={() => setYearModalOpen(true)}
            className="text-[11px] font-medium uppercase tracking-wide hover:text-accent transition-colors cursor-pointer"
          >
            {monthNames[viewMonth]} {viewYear}
          </button>
          <div className="flex items-center gap-0.5">
            <button onClick={nextMonth} className="p-0.5 hover:text-accent transition-colors text-text-dim"><ChevronRight className="w-3 h-3" /></button>
            <button onClick={nextYear} className="p-0.5 hover:text-accent transition-colors text-text-dim"><ChevronsRight className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-center text-[9px] text-text-dim font-medium">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <MiniMonthGrid year={viewYear} month={viewMonth} logMap={logMap} now={now} />
      </div>

      {/* Yearly Calendar Modal */}
      <Dialog.Root open={yearModalOpen} onOpenChange={setYearModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-3xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">
                {locale === "ru" ? "Годовой календарь" : locale === "kz" ? "Жылдық күнтізбе" : "Year Calendar"} — {viewYear}
              </Dialog.Title>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewYear(viewYear - 1)} className="p-1 hover:bg-bg-elevated rounded text-text-dim"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setViewYear(viewYear + 1)} className="p-1 hover:bg-bg-elevated rounded text-text-dim"><ChevronRight className="w-4 h-4" /></button>
                <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, monthIdx) => {
                // Count completions for this month
                const daysInM = new Date(viewYear, monthIdx + 1, 0).getDate();
                let completedCount = 0;
                for (let d = 1; d <= daysInM; d++) {
                  const ds = `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  if (logMap.get(ds)) completedCount++;
                }
                return (
                  <div key={monthIdx} className="bg-bg-elevated rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">{monthNamesFull[monthIdx]}</span>
                      <span className="text-[10px] font-mono text-accent">{completedCount}d</span>
                    </div>
                    <div className="grid grid-cols-7 gap-px">
                      {dayLabels.map((d, i) => (
                        <div key={i} className="text-center text-[7px] text-text-dim">{d}</div>
                      ))}
                    </div>
                    <MiniMonthGrid year={viewYear} month={monthIdx} logMap={logMap} now={now} mini />
                  </div>
                );
              })}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/* ──── Mini Month Grid (shared between card and yearly modal) ──── */
function MiniMonthGrid({ year, month, logMap, now, mini }: {
  year: number;
  month: number;
  logMap: Map<string, boolean>;
  now: Date;
  mini?: boolean;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const todayDate = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className={`grid grid-cols-7 ${mini ? "gap-px" : "gap-0.5"}`}>
      {Array.from({ length: offset }).map((_, i) => (
        <div key={`e-${i}`} className="w-full aspect-square" />
      ))}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const completed = logMap.get(dateStr);
        const isToday = isCurrentMonth && day === todayDate;
        return (
          <div key={dateStr}
            className={`w-full aspect-square rounded-[2px] flex items-center justify-center transition-colors ${isToday ? "ring-1 ring-accent" : ""}`}
            style={{ backgroundColor: completed ? "#4ade80" : "rgba(255,255,255,0.04)" }}
            title={dateStr}>
            <span className={`${mini ? "text-[6px]" : "text-[9px]"} font-mono leading-none ${completed ? "text-black/70 font-medium" : "text-text-dim/40"}`}>
              {day}
            </span>
          </div>
        );
      })}
    </div>
  );
}
