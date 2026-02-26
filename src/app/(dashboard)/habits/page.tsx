"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_ICONS } from "@/types";
import type { Block, HabitFrequency } from "@prisma/client";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Trash2, X, Check, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { getHabitLevel, HABIT_LEVEL_TITLES } from "@/lib/habitLevels";
import { SUGGESTED_HABITS, type SuggestedHabit } from "@/data/suggestedHabits";

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
  totalLogs: number;
  negativeIfSkip: string | null;
  positiveIfDone: string | null;
  logs: HabitLog[];
}

const BLOCKS: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];
const FREQUENCIES: HabitFrequency[] = ["DAILY", "WEEKDAYS", "THREE_PER_WEEK", "CUSTOM"];

export default function HabitsPage() {
  const { t, locale } = useLocale();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", block: "HEALTH" as Block, frequency: "DAILY" as HabitFrequency, xpPerLog: 15, negativeIfSkip: "", positiveIfDone: "" });
  const [showSuggested, setShowSuggested] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const fetchHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (res.ok) setHabits(await res.json());
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const createHabit = async () => {
    if (!form.name.trim()) return;
    const body: Record<string, unknown> = { ...form };
    if (!body.negativeIfSkip) delete body.negativeIfSkip;
    if (!body.positiveIfDone) delete body.positiveIfDone;
    const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success("Привычка создана!"); setModalOpen(false); setForm({ name: "", block: "HEALTH", frequency: "DAILY", xpPerLog: 15, negativeIfSkip: "", positiveIfDone: "" }); fetchHabits(); }
  };

  const addSuggestedHabit = async (sh: SuggestedHabit) => {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: sh.name, block: sh.block, frequency: sh.frequency, xpPerLog: sh.xpPerLog, negativeIfSkip: sh.negativeIfSkip, positiveIfDone: sh.positiveIfDone }),
    });
    if (res.ok) { toast.success(`Добавлено: ${sh.name}`); fetchHabits(); }
  };

  const toggleToday = async (habitId: string, prevLevel: number) => {
    const res = await fetch(`/api/habits/${habitId}/log`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today }) });
    if (res.ok) {
      const data = await res.json();
      if (data.xpAwarded > 0) toast.success(`+${data.xpAwarded} XP`);
      if (data.newLevel && data.newLevel > prevLevel) {
        const title = HABIT_LEVEL_TITLES[locale]?.[data.newLevel] || data.levelTitle;
        toast.success(`⬆️ Уровень ${data.newLevel}: ${title}!`);
      }
      fetchHabits();
    }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm("Удалить привычку?")) return;
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    fetchHabits();
  };

  const isDoneToday = (habit: Habit) => habit.logs.some((l) => {
    const d = new Date(l.date).toISOString().split("T")[0];
    return d === today && (l.done || l.completed);
  });

  const existingNames = new Set(habits.map((h) => h.name));
  const filteredSuggestions = SUGGESTED_HABITS.filter((sh) => !existingNames.has(sh.name));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.habits.title}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSuggested(!showSuggested)}
            className="flex items-center gap-2 bg-bg-elevated border border-border text-text-mid px-4 py-2 rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors">
            {showSuggested ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t.habits.suggested}
          </button>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90">
            <Plus className="w-4 h-4" />{t.habits.addHabit}
          </button>
        </div>
      </div>

      {showSuggested && filteredSuggestions.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">{t.habits.suggested}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredSuggestions.map((sh) => (
              <div key={sh.name} className="flex items-center justify-between bg-bg-elevated rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0">{BLOCK_ICONS[sh.block]}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{sh.name}</div>
                    <div className="text-xs text-text-dim">+{sh.xpPerLog} XP · {t.blocks[sh.block]}</div>
                  </div>
                </div>
                <button onClick={() => addSuggestedHabit(sh)} className="flex-shrink-0 ml-2 p-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-text-dim">{t.common.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => {
            const done = isDoneToday(habit);
            const totalLogs = habit.logs.filter((l) => l.done || l.completed).length;
            const levelInfo = getHabitLevel(totalLogs);
            const levelTitle = HABIT_LEVEL_TITLES[locale]?.[levelInfo.level] || levelInfo.title;

            return (
              <div key={habit.id} className="bg-bg-card border border-border rounded-xl p-4 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{BLOCK_ICONS[habit.block]}</span>
                    <span className="font-medium text-sm truncate">{habit.name}</span>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className="p-1 hover:text-red-400 text-text-dim opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">
                    Lv.{levelInfo.level} {levelTitle}
                  </span>
                  {habit.currentStreak > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <Flame className="w-3 h-3" />{habit.currentStreak}
                    </span>
                  )}
                </div>

                <div className="h-1 bg-bg-elevated rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${levelInfo.progress * 100}%` }} />
                </div>

                <MonthCalendarGrid logs={habit.logs} />

                {(habit.negativeIfSkip || habit.positiveIfDone) && (
                  <div className="mt-3 space-y-1">
                    {habit.negativeIfSkip && (
                      <div className="text-xs text-red-400/70 flex items-start gap-1.5">
                        <span className="flex-shrink-0">⚠️</span>
                        <span>{habit.negativeIfSkip}</span>
                      </div>
                    )}
                    {habit.positiveIfDone && (
                      <div className="text-xs text-green-400/70 flex items-start gap-1.5">
                        <span className="flex-shrink-0">✅</span>
                        <span>{habit.positiveIfDone}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-text-dim font-mono">+{habit.xpPerLog} XP (×{levelInfo.xpMultiplier.toFixed(1)})</span>
                  <button onClick={() => toggleToday(habit.id, habit.level)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      done ? "bg-accent/20 text-accent border border-accent/30" : "bg-bg-elevated text-text-mid border border-border hover:border-accent/50"
                    }`}>
                    <Check className="w-3.5 h-3.5" />
                    {done ? "Done" : "Log"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">{t.habits.addHabit}</Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-mid mb-1 block">Название</label>
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
                <label className="text-sm text-text-mid mb-1 block">{t.common.xp} за выполнение</label>
                <input type="number" value={form.xpPerLog} onChange={(e) => setForm({ ...form, xpPerLog: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">⚠️ Если не сделать</label>
                <input value={form.negativeIfSkip} onChange={(e) => setForm({ ...form, negativeIfSkip: e.target.value })}
                  placeholder="Например: вялость, стресс"
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">✅ Если сделать</label>
                <input value={form.positiveIfDone} onChange={(e) => setForm({ ...form, positiveIfDone: e.target.value })}
                  placeholder="Например: энергия, ясность"
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Dialog.Close className="flex-1 bg-bg-elevated border border-border rounded-lg py-2 text-sm">{t.common.cancel}</Dialog.Close>
              <button onClick={createHabit} className="flex-1 bg-accent text-bg rounded-lg py-2 text-sm font-medium hover:bg-accent/90">{t.common.create}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function MonthCalendarGrid({ logs }: { logs: HabitLog[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const logMap = new Map<string, boolean>();
  logs.forEach((l) => {
    const d = new Date(l.date).toISOString().split("T")[0];
    if (l.done || l.completed) logMap.set(d, true);
  });

  const dayLabels = ["П", "В", "С", "Ч", "П", "С", "В"];
  const todayDate = now.getDate();

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-text-dim">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} className="w-full aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const done = logMap.get(dateStr);
          const isToday = day === todayDate;
          return (
            <div key={dateStr}
              className={`w-full aspect-square rounded-sm flex items-center justify-center text-[9px] font-mono ${isToday ? "ring-1 ring-accent" : ""}`}
              style={{ backgroundColor: done ? "#4ade80" : "#1a1a25" }}
              title={dateStr}>
              <span className={done ? "text-black/70" : "text-text-dim/40"}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
