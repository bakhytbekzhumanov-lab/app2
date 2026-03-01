"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS, BLOCK_ICONS } from "@/types";
import type { Block } from "@prisma/client";
import { toast } from "sonner";
import { Calendar, Trash2, CheckCircle, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { RECOVERY_TYPES, SLEEP_MAX, PHYSICAL_MAX, MENTAL_MAX, SLEEP_WEIGHT, PHYSICAL_WEIGHT, MENTAL_WEIGHT, calcBaseEnergy } from "@/lib/energy";
import { getActionPraise, getHabitPraise } from "@/lib/celebration";

const ALL_BLOCKS: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];

interface ActionItem {
  id: string;
  name: string;
  block: Block;
  xp: number;
  difficulty: string;
  isActive?: boolean;
}
interface LogItem {
  id: string;
  actionId: string;
  xpAwarded: number;
  date: string;
  note: string | null;
  action: ActionItem;
  createdAt: string;
}
interface HabitItem {
  id: string;
  name: string;
  block: Block;
  isActive: boolean;
  frequency: string;
  xpPerLog: number;
  logs: { id: string; date: string; completed: boolean }[];
}
interface ProfileData {
  totalXp: number;
  level: { level: number; currentXP: number; nextLevelXP: number; progress: number };
}
interface EnergyData {
  id: string;
  currentEnergy: number;
  baseEnergy: number;
  morningDone: boolean;
  isBurnout: boolean;
  sleepScore: number;
  physicalScore: number;
  mentalScore: number;
  streakBonus: number;
  spentTotal: number;
  recoveredTotal: number;
  recoveries: { id: string; type: string; epRestored: number }[];
}

export default function TodayPage() {
  const { locale } = useLocale();
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [quickAdd, setQuickAdd] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeBlock, setActiveBlock] = useState<Block | "ALL">("ALL");
  const [mainTaskDone, setMainTaskDone] = useState(false);
  const [energy, setEnergy] = useState<EnergyData | null>(null);
  const [morningForm, setMorningForm] = useState({ sleep: 75, physical: 70, mental: 70 });
  const [showMorning, setShowMorning] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Use local date parts to avoid UTC shift (e.g. Asia/Almaty midnight → previous day in UTC)
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dateStr = toLocalDateStr(date);

  const fetchEnergy = useCallback(async () => {
    try {
      const res = await fetch("/api/energy");
      if (res.ok) {
        const data = await res.json();
        setEnergy(data);
        if (!data.morningDone) setShowMorning(true);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Calculate range to cover selected date
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.max(1, Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const [actRes, logRes, habRes, profRes, chkRes] = await Promise.all([
        fetch("/api/actions"),
        fetch(`/api/logs?date=${dateStr}`),
        fetch("/api/habits"),
        fetch("/api/profile"),
        fetch(`/api/profile/checkins?range=${diffDays}`),
      ]);
      const actData = await actRes.json();
      const logData = await logRes.json();
      const habData = await habRes.json();
      const profData = await profRes.json();
      const chkData = await chkRes.json();
      setActions(Array.isArray(actData) ? actData.filter((a: ActionItem) => a.isActive !== false) : []);
      setLogs(Array.isArray(logData) ? logData : []);
      setHabits(Array.isArray(habData) ? habData.filter((h: HabitItem) => h.isActive) : []);
      setProfile(profData);
      if (Array.isArray(chkData)) {
        const dayChk = chkData.find((c: { date: string; mainTaskDone: boolean }) => toLocalDateStr(new Date(c.date)) === dateStr);
        setMainTaskDone(dayChk ? dayChk.mainTaskDone : false);
      } else {
        setMainTaskDone(false);
      }
    } catch { /* ignore */ }
  }, [dateStr, date]);

  useEffect(() => { fetchData(); fetchEnergy(); }, [fetchData, fetchEnergy]);

  const logAction = async (actionId: string) => {
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId, date: dateStr }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`+${data.xpAwarded} XP`);
      if (data.coinBonus > 0) toast.success(`+${data.coinBonus} coins!`);
      setTimeout(() => toast(getActionPraise(locale), { duration: 3000 }), 400);
      // Spend energy
      const action = actions.find((a) => a.id === actionId);
      if (action) {
        const costMap: Record<string, number> = { EASY: 5, NORMAL: 10, HARD: 20, VERY_HARD: 35, LEGENDARY: 60 };
        const cost = costMap[action.difficulty] || 10;
        await fetch("/api/energy/spend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: cost }) });
        fetchEnergy();
      }
      fetchData();
    }
  };

  const logHabit = async (habitId: string) => {
    const res = await fetch(`/api/habits/${habitId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    });
    if (res.ok) {
      toast.success(getHabitPraise(locale));
      // Spend 5 EP for habits
      await fetch("/api/energy/spend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 5 }) });
      fetchEnergy();
      fetchData();
    }
  };

  const deleteLog = async (logId: string) => {
    await fetch(`/api/logs/${logId}`, { method: "DELETE" });
    fetchData();
  };

  const toggleMainTask = async () => {
    const newVal = !mainTaskDone;
    setMainTaskDone(newVal);
    await fetch("/api/profile/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, mainTaskDone: newVal, totalTasks: actions.length, completedTasks: logs.length, xpEarned: logs.reduce((s, l) => s + l.xpAwarded, 0) }),
    });
    // Quest complete bonus
    if (newVal) {
      await fetch("/api/energy/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "QUEST_COMPLETE" }) });
      fetchEnergy();
    }
    toast.success(newVal
      ? (locale === "ru" ? "Главное дело выполнено!" : "Main task completed!")
      : (locale === "ru" ? "Отметка снята" : "Unmarked"));
  };

  const submitMorning = async () => {
    const res = await fetch("/api/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sleepScore: morningForm.sleep, physicalScore: morningForm.physical, mentalScore: morningForm.mental }),
    });
    if (res.ok) {
      const data = await res.json();
      setEnergy(data);
      setShowMorning(false);
      toast.success(`⚡ ${locale === "ru" ? "Энергия" : "Energy"}: ${data.currentEnergy} EP`);
    }
  };

  const applyRecovery = async (type: string) => {
    const res = await fetch("/api/energy/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setEnergy(data);
      const rt = RECOVERY_TYPES.find((r) => r.type === type);
      toast.success(`${rt?.icon || "⚡"} +${rt?.ep || 0} EP`);
    } else {
      const err = await res.json();
      toast.error(err.error || "Error");
    }
  };

  // Quick add suggestions
  const suggestions = useMemo(() => {
    if (!quickAdd.trim()) return [];
    const q = quickAdd.toLowerCase();
    return actions.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 6);
  }, [quickAdd, actions]);

  const filteredActions = useMemo(() => {
    if (activeBlock === "ALL") return actions;
    return actions.filter((a) => a.block === activeBlock);
  }, [actions, activeBlock]);

  const loggedActionIds = useMemo(() => new Set(logs.map((l) => l.actionId)), [logs]);

  const todayHabits = useMemo(() => {
    return habits.map((h) => {
      const todayLog = h.logs.find((l) => {
        const logDate = toLocalDateStr(new Date(l.date));
        return logDate === dateStr && l.completed;
      });
      return { ...h, completedToday: !!todayLog };
    });
  }, [habits, dateStr]);

  const habitsCompleted = todayHabits.filter((h) => h.completedToday).length;
  const xpToday = logs.reduce((s, l) => s + l.xpAwarded, 0);

  const dateFormatted = date.toLocaleDateString(locale === "kz" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU", {
    weekday: "short", year: "numeric", month: "long", day: "numeric",
  });
  const dateShort = `${String(date.getDate()).padStart(2, "0")} . ${String(date.getMonth() + 1).padStart(2, "0")} . ${date.getFullYear()}`;
  const lvl = profile?.level || { level: 1, currentXP: 0, nextLevelXP: 100, progress: 0 };

  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const isToday = date.getTime() === todayDate.getTime();
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setDate(d); };

  // Recovery usage counts
  const recoveryUsage = useMemo(() => {
    if (!energy?.recoveries) return {};
    const counts: Record<string, number> = {};
    energy.recoveries.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return counts;
  }, [energy]);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">
      {/* Header row: date + xp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 hover:border-accent/40 transition-colors"
          >
            {dateShort}
            <Calendar className="w-3.5 h-3.5 text-text-dim" />
          </button>
          <span className="text-xs text-text-dim hidden sm:inline">{dateFormatted}</span>
          {!isToday && (
            <button onClick={() => goToday()} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium hover:bg-accent/25 transition-colors">
              → {locale === "ru" ? "Сегодня" : locale === "kz" ? "Бүгін" : "Today"}
            </button>
          )}
          {showCalendar && (
            <DatePickerCalendar selected={date} locale={locale}
              onSelect={(d) => { setDate(d); setShowCalendar(false); }}
              onClose={() => setShowCalendar(false)} />
          )}
        </div>
        <span className="text-xl font-mono font-bold text-accent">{xpToday} <span className="text-xs font-normal text-text-dim">XP</span></span>
      </div>

      {/* Compact bars: XP + Energy */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-text-dim">Lv.{lvl.level} · {lvl.currentXP}/{lvl.nextLevelXP} XP</span>
            <span className="font-mono text-accent">{Math.round(lvl.progress * 100)}%</span>
          </div>
          <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.max(lvl.progress * 100, 2)}%` }} />
          </div>
        </div>
        {energy && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-text-dim flex items-center gap-1">
                <Zap className="w-3 h-3 text-sky-400" />
                {locale === "ru" ? "Энергия" : "Energy"}
                {energy.isBurnout && <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-400">{locale === "ru" ? "BURNOUT" : "BURNOUT"}</span>}
              </span>
              <span className="font-mono text-sky-400">{energy.currentEnergy}/100</span>
            </div>
            <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(energy.currentEnergy, 100))}%`, backgroundColor: "#38bdf8" }} />
            </div>
          </div>
        )}
      </div>

      {/* Morning Energy Setup — compact */}
      {showMorning && energy && !energy.morningDone && (
        <div className="bg-bg-card border border-sky-400/20 rounded-xl px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">🌅 {locale === "ru" ? "Утренняя энергия" : "Morning Energy"}</span>
            <span className="text-xs font-mono text-sky-400 font-bold">{calcBaseEnergy(morningForm.sleep, morningForm.physical, morningForm.mental)} EP</span>
          </div>
          {/* Sliders */}
          {[
            { key: "sleep" as const, icon: "😴", label: locale === "ru" ? "Сон" : "Sleep", w: SLEEP_WEIGHT, max: SLEEP_MAX },
            { key: "physical" as const, icon: "💪", label: locale === "ru" ? "Тело" : "Body", w: PHYSICAL_WEIGHT, max: PHYSICAL_MAX },
            { key: "mental" as const, icon: "🧠", label: locale === "ru" ? "Разум" : "Mind", w: MENTAL_WEIGHT, max: MENTAL_MAX },
          ].map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-xs w-16 flex items-center gap-1 shrink-0">{s.icon} {s.label}</span>
              <input type="range" min={0} max={s.max} value={morningForm[s.key]}
                onChange={(e) => setMorningForm({ ...morningForm, [s.key]: parseInt(e.target.value) })}
                className="flex-1 h-1 bg-bg-elevated rounded-full appearance-none cursor-pointer accent-sky-400" />
              <span className="text-[11px] font-mono text-sky-400 w-7 text-right">{morningForm[s.key]}</span>
            </div>
          ))}
          {/* Preview bar + button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${calcBaseEnergy(morningForm.sleep, morningForm.physical, morningForm.mental)}%`, backgroundColor: "#38bdf8" }} />
            </div>
            <button onClick={submitMorning}
              className="bg-sky-400 text-bg px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-400/90 transition-colors shrink-0">
              {locale === "ru" ? "Начать день" : "Start Day"}
            </button>
          </div>
        </div>
      )}

      {/* Quick Add */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-bg-card border border-border rounded-lg px-3 py-2.5">
          <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
          <input type="text" value={quickAdd}
            onChange={(e) => { setQuickAdd(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={locale === "ru" ? "Быстрое добавление..." : locale === "kz" ? "Жылдам қосу..." : "Quick add..."}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-text-dim" />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden">
            {suggestions.map((s) => (
              <button key={s.id} onMouseDown={() => { logAction(s.id); setQuickAdd(""); setShowSuggestions(false); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-bg-elevated transition-colors text-left">
                <span className="text-sm">{s.name}</span>
                <span className="text-xs font-mono" style={{ color: BLOCK_COLORS[s.block] }}>+{s.xp}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-widest text-text-dim uppercase">{locale === "ru" ? "Действия" : "Actions"}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setActiveBlock("ALL")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${activeBlock === "ALL" ? "bg-accent/15 text-accent" : "text-text-dim hover:text-text-mid"}`}>
            {locale === "ru" ? "Все" : "All"}
          </button>
          {ALL_BLOCKS.map((block) => (
            <button key={block} onClick={() => setActiveBlock(block)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${activeBlock === block ? "bg-accent/15 text-accent" : "text-text-dim hover:text-text-mid"}`}>
              {BLOCK_ICONS[block]}
            </button>
          ))}
        </div>
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredActions.map((action) => {
            const isLogged = loggedActionIds.has(action.id);
            return (
              <button key={action.id} onClick={() => !isLogged && logAction(action.id)} disabled={isLogged}
                className={`w-full flex items-center gap-3 bg-bg-card border border-border rounded-lg px-3 py-2.5 text-left transition-all ${isLogged ? "opacity-40" : "hover:bg-bg-card-hover hover:border-border-hover"}`}>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isLogged ? "border-accent bg-accent/20" : "border-border"}`}>
                  {isLogged && <CheckCircle className="w-3 h-3 text-accent" />}
                </div>
                <span className={`text-sm flex-1 ${isLogged ? "line-through text-text-dim" : ""}`}>{action.name}</span>
                <span className="text-xs font-mono" style={{ color: BLOCK_COLORS[action.block] }}>+{action.xp}</span>
              </button>
            );
          })}
          {filteredActions.length === 0 && (
            <div className="text-center py-6 text-text-dim text-sm">{locale === "ru" ? "Нет действий" : "No actions"}</div>
          )}
        </div>
      </div>

      {/* Habits */}
      {todayHabits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-widest text-text-dim uppercase">{locale === "ru" ? "Привычки" : "Habits"}</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-mono text-text-dim">{habitsCompleted}/{todayHabits.length}</span>
          </div>
          <div className="space-y-1.5">
            {todayHabits.map((habit) => (
              <button key={habit.id} onClick={() => !habit.completedToday && logHabit(habit.id)} disabled={habit.completedToday}
                className={`w-full flex items-center gap-3 bg-bg-card border border-border rounded-lg px-3 py-2.5 text-left transition-all ${habit.completedToday ? "opacity-40" : "hover:bg-bg-card-hover hover:border-border-hover"}`}>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${habit.completedToday ? "border-accent bg-accent/20" : "border-border"}`}>
                  {habit.completedToday && <CheckCircle className="w-3 h-3 text-accent" />}
                </div>
                <span className={`text-sm flex-1 ${habit.completedToday ? "line-through text-text-dim" : ""}`}>{habit.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BLOCK_COLORS[habit.block] + "15", color: BLOCK_COLORS[habit.block] }}>
                  {BLOCK_ICONS[habit.block]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Task */}
      <button onClick={toggleMainTask}
        className={`w-full flex items-center gap-3 border rounded-lg px-3 py-2.5 text-left transition-all ${mainTaskDone ? "border-accent/30 bg-accent/5" : "border-border bg-bg-card hover:bg-bg-card-hover"}`}>
        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${mainTaskDone ? "border-accent bg-accent/20" : "border-border"}`}>
          {mainTaskDone && <CheckCircle className="w-3.5 h-3.5 text-accent" />}
        </div>
        <span className={`text-sm ${mainTaskDone ? "text-accent font-medium" : ""}`}>
          {locale === "ru"
            ? (mainTaskDone ? "Главное дело ✓" : "Главное дело дня")
            : (mainTaskDone ? "Main task ✓" : "Main task of the day")}
        </span>
      </button>

      {/* Recovery */}
      {energy && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-widest text-text-dim uppercase">{locale === "ru" ? "Восстановление" : "Recovery"}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RECOVERY_TYPES.filter((r) => r.type !== "QUEST_COMPLETE").map((rt) => {
              const used = recoveryUsage[rt.type] || 0;
              const maxed = used >= rt.maxPerDay;
              return (
                <button key={rt.type} onClick={() => !maxed && applyRecovery(rt.type)} disabled={maxed}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                    maxed ? "opacity-30 cursor-not-allowed border-border" : "border-border hover:border-sky-400/30"
                  }`}>
                  <span>{rt.icon}</span>
                  <span className="font-mono text-sky-400">+{rt.ep}</span>
                  {rt.maxPerDay < 99 && <span className="text-text-dim text-[10px]">{used}/{rt.maxPerDay}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Journal */}
      {logs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-widest text-text-dim uppercase">{locale === "ru" ? "Журнал" : "Journal"}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-card transition-colors group">
                <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-sm flex-1 text-text-dim">{log.action.name}</span>
                <span className="text-xs font-mono text-accent">+{log.xpAwarded}</span>
                <button onClick={() => deleteLog(log.id)} className="p-0.5 text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──── Date Picker Calendar ──── */
function DatePickerCalendar({ selected, locale, onSelect, onClose }: {
  selected: Date;
  locale: string;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const selectedStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;

  const monthNames = locale === "kz"
    ? ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"]
    : locale === "en"
      ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      : ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  const dayLabels = locale === "kz"
    ? ["Д", "С", "С", "Б", "Ж", "С", "Ж"]
    : locale === "en"
      ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); } else setViewMonth(viewMonth + 1); };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />
      {/* Calendar Popup */}
      <div className="absolute top-full left-0 mt-2 z-40 bg-bg-card border border-border rounded-xl shadow-2xl p-4 w-[280px]">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 hover:bg-bg-elevated rounded transition-colors text-text-dim hover:text-text">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold">{monthNames[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-bg-elevated rounded transition-colors text-text-dim hover:text-text">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-text-dim font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e-${i}`} className="w-full aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = ds === selectedStr;
            const isToday = ds === todayStr;
            return (
              <button
                key={ds}
                onClick={() => {
                  const d = new Date(viewYear, viewMonth, day);
                  d.setHours(0, 0, 0, 0);
                  onSelect(d);
                }}
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                  ${isSelected ? "bg-accent text-bg font-bold" : ""}
                  ${isToday && !isSelected ? "ring-1 ring-accent text-accent" : ""}
                  ${!isSelected && !isToday ? "text-text hover:bg-bg-elevated" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
