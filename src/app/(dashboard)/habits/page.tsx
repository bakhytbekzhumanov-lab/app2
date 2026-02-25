"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS, BLOCK_ICONS } from "@/types";
import type { Block, HabitFrequency } from "@prisma/client";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Trash2, X, Check, Flame } from "lucide-react";

interface HabitLog { id: string; date: string; done: boolean; }
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
  logs: HabitLog[];
}

const BLOCKS: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];
const FREQUENCIES: HabitFrequency[] = ["DAILY", "WEEKDAYS", "THREE_PER_WEEK", "CUSTOM"];

export default function HabitsPage() {
  const { t } = useLocale();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", block: "HEALTH" as Block, frequency: "DAILY" as HabitFrequency, xpPerLog: 15 });
  const today = new Date().toISOString().split("T")[0];

  const fetchHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (res.ok) setHabits(await res.json());
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const createHabit = async () => {
    if (!form.name.trim()) return;
    const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Habit created!"); setModalOpen(false); setForm({ name: "", block: "HEALTH", frequency: "DAILY", xpPerLog: 15 }); fetchHabits(); }
  };

  const toggleToday = async (habitId: string) => {
    const res = await fetch(`/api/habits/${habitId}/log`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today }) });
    if (res.ok) { const data = await res.json(); if (data.xpAwarded > 0) toast.success(`+${data.xpAwarded} XP`); fetchHabits(); }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    fetchHabits();
  };

  const isDoneToday = (habit: Habit) => habit.logs.some((l) => new Date(l.date).toISOString().split("T")[0] === today && l.done);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.habits.title}</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90">
          <Plus className="w-4 h-4" />{t.habits.addHabit}
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-text-dim">{t.common.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => {
            const done = isDoneToday(habit);
            return (
              <div key={habit.id} className="bg-bg-card border border-border rounded-xl p-4 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span>{BLOCK_ICONS[habit.block]}</span>
                    <span className="font-medium text-sm">{habit.name}</span>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className="p-1 hover:text-red-400 text-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: BLOCK_COLORS[habit.block] + "20", color: BLOCK_COLORS[habit.block] }}>
                    {t.blocks[habit.block]}
                  </span>
                  <span className="text-xs text-text-dim font-mono">{t.habits.level} {habit.level}</span>
                  {habit.currentStreak > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <Flame className="w-3 h-3" />{habit.currentStreak}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mb-3">
                  <MiniHeatmap logs={habit.logs} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-dim font-mono">+{habit.xpPerLog} XP</span>
                  <button onClick={() => toggleToday(habit.id)}
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">{t.habits.addHabit}</Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-mid mb-1 block">Name</label>
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
                <label className="text-sm text-text-mid mb-1 block">{t.common.xp} per log</label>
                <input type="number" value={form.xpPerLog} onChange={(e) => setForm({ ...form, xpPerLog: parseInt(e.target.value) || 0 })}
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

function MiniHeatmap({ logs }: { logs: HabitLog[] }) {
  const days = 30;
  const logMap = new Map<string, boolean>();
  logs.forEach((l) => { logMap.set(new Date(l.date).toISOString().split("T")[0], l.done); });

  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const done = logMap.get(key);
    cells.push(
      <div key={key} className="w-2 h-2 rounded-sm" style={{ backgroundColor: done ? "#4ade80" : "#1a1a25" }} title={key} />
    );
  }
  return <div className="flex flex-wrap gap-0.5">{cells}</div>;
}
