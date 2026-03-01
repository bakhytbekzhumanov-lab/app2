"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS, BLOCK_ICONS } from "@/types";
import type { Block } from "@prisma/client";
import { Flame, Zap, Target, Repeat, X } from "lucide-react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { calcKanbanXP } from "@/lib/xp";

interface ProfileData {
  nickname: string;
  totalXp: number;
  totalCoins: number;
  currentStreak: number;
  avatarStage: number;
  level: { level: number; currentXP: number; nextLevelXP: number; progress: number };
}

interface BlockData {
  block: Block;
  xp: number;
  cap: number;
  percentage: number;
  trend: string;
}

interface CheckinData {
  date: string;
  mainTaskDone: boolean;
  completedTasks: number;
  totalTasks: number;
}

interface KanbanTask {
  id: string;
  status: string;
  importance: number;
  discomfort: number;
  urgency: number;
  completedAt: string | null;
}

interface HabitData {
  id: string;
  xpPerLog: number;
  logs: { date: string; completed: boolean }[];
}

interface EnergyData {
  currentEnergy: number;
  baseEnergy: number;
  isBurnout: boolean;
  sleepScore: number;
  physicalScore: number;
  mentalScore: number;
  morningDone: boolean;
}

export default function HomePage() {
  const { t, locale } = useLocale();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [todayStats, setTodayStats] = useState({ xp: 0, actions: 0, habits: 0 });
  const [heatmapModalType, setHeatmapModalType] = useState<"mainTask" | "allTasks" | null>(null);
  const [yearCheckins, setYearCheckins] = useState<CheckinData[]>([]);
  const [energy, setEnergy] = useState<EnergyData | null>(null);

  // Use local date parts to avoid UTC shift in non-UTC timezones
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = toLocalDateStr(new Date());

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/weekly").then((r) => r.json()),
      fetch("/api/profile/checkins?range=90").then((r) => r.json()),
      fetch(`/api/logs?date=${today}`).then((r) => r.json()),
      fetch("/api/kanban").then((r) => r.json()),
      fetch("/api/habits").then((r) => r.json()),
    ]).then(([prof, weekly, chk, logs, kanban, habits]) => {
      setProfile(prof);
      setBlocks(weekly.blocks || []);
      setCheckins(Array.isArray(chk) ? chk : []);

      // Logs XP
      const logsArr = Array.isArray(logs) ? logs : [];
      const logXp = logsArr.reduce((s: number, l: { xpAwarded: number }) => s + l.xpAwarded, 0);

      // Kanban XP (completed today)
      const kanbanArr = Array.isArray(kanban) ? kanban : [];
      const kanbanXp = kanbanArr
        .filter((t: KanbanTask) => t.status === "DONE" && t.completedAt && toLocalDateStr(new Date(t.completedAt)) === today)
        .reduce((s: number, t: KanbanTask) => s + calcKanbanXP(t.importance, t.discomfort, t.urgency), 0);

      // Habits XP (completed today)
      const habitsArr: HabitData[] = Array.isArray(habits) ? habits : [];
      let habitsDone = 0;
      let habitXp = 0;
      habitsArr.forEach((h) => {
        const todayLog = h.logs.find((l) => toLocalDateStr(new Date(l.date)) === today && l.completed);
        if (todayLog) { habitsDone++; habitXp += h.xpPerLog; }
      });

      setTodayStats({
        xp: logXp + kanbanXp + habitXp,
        actions: logsArr.length + habitsDone,
        habits: habitsDone,
      });
    }).catch(() => {});
    // Fetch energy separately
    fetch("/api/energy").then((r) => r.json()).then((data) => setEnergy(data)).catch(() => {});
  }, [today]);

  const openHeatmapModal = async (type: "mainTask" | "allTasks") => {
    setHeatmapModalType(type);
    try {
      const res = await fetch("/api/profile/checkins?range=365");
      const data = await res.json();
      setYearCheckins(Array.isArray(data) ? data : []);
    } catch {
      setYearCheckins([]);
    }
  };

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 w-full" />
        ))}
      </div>
    );
  }

  const lvl = profile.level;

  const yearStats = (() => {
    const total = yearCheckins.length;
    const mainDone = yearCheckins.filter((c) => c.mainTaskDone).length;
    const fullDone = yearCheckins.filter((c) => c.totalTasks > 0 && c.completedTasks >= c.totalTasks).length;
    return { total, mainDone, fullDone, rate: total > 0 ? Math.round((mainDone / total) * 100) : 0 };
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting + Radar */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <div className="flex gap-6">
          {/* Left: greeting, bars */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    {t.dashboard.greeting}, {profile.nickname}!
                  </h1>
                  {profile.currentStreak > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-mono font-bold text-orange-400">{profile.currentStreak}</span>
                    </div>
                  )}
                </div>
                <p className="text-text-dim text-sm mt-1">
                  {new Date().toLocaleDateString(locale === "en" ? "en-US" : locale === "kz" ? "kk-KZ" : "ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-dim tracking-widest uppercase">
                    Level {lvl.level} · {lvl.currentXP} / {lvl.nextLevelXP} XP
                  </span>
                  <span className="font-mono text-accent">{Math.round(lvl.progress * 100)}%</span>
                </div>
                <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.max(lvl.progress * 100, 2)}%` }} />
                </div>
              </div>

              {/* Energy Bar (blue) */}
              {energy && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-text-dim tracking-widest uppercase flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      {locale === "ru" ? "Энергия" : locale === "kz" ? "Энергия" : "Energy"}
                      {energy.isBurnout && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium ml-1">
                          {locale === "ru" ? "ВЫГОРАНИЕ" : "BURNOUT"}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-sky-400">{energy.currentEnergy}/100</span>
                  </div>
                  <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(0, Math.min(energy.currentEnergy, 100))}%`, backgroundColor: "#38bdf8" }} />
                  </div>
                  {!energy.morningDone && (
                    <Link href="/today" className="text-[10px] text-sky-400/70 mt-1 block hover:text-sky-400 transition-colors">
                      ☀️ {locale === "ru" ? "Настройте утреннюю энергию →" : "Set up morning energy →"}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Mini Radar → links to /weekly */}
          <Link href="/weekly" className="flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity" title={locale === "ru" ? "Баланс недели →" : "Weekly balance →"}>
            <MiniRadar blocks={blocks} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/today" className="bg-bg-card border border-border rounded-xl p-4 hover:border-accent/30 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 text-text-dim text-sm mb-2"><Zap className="w-4 h-4 text-accent" />{t.dashboard.todayXP}</div>
          <div className="text-2xl font-mono font-bold text-accent">{todayStats.xp}</div>
        </Link>
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-dim text-sm mb-2"><Target className="w-4 h-4 text-blue-400" />{t.dashboard.actionsToday}</div>
          <div className="text-2xl font-mono font-bold">{todayStats.actions}</div>
        </div>
        <Link href="/habits" className="bg-bg-card border border-border rounded-xl p-4 hover:border-accent/30 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 text-text-dim text-sm mb-2"><Repeat className="w-4 h-4 text-purple-400" />{t.dashboard.habitsToday}</div>
          <div className="text-2xl font-mono font-bold">{todayStats.habits}</div>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Blocks</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {blocks.map((b) => (
            <div key={b.block} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{BLOCK_ICONS[b.block]}</span>
                <span className="text-sm font-medium" style={{ color: BLOCK_COLORS[b.block] }}>{t.blocks[b.block]}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-dim mb-1">
                <span>{b.xp}/{b.cap}</span><span>{b.percentage}%</span>
              </div>
              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(b.percentage, 100)}%`, backgroundColor: BLOCK_COLORS[b.block] }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3 cursor-pointer hover:text-accent transition-colors" onClick={() => openHeatmapModal("mainTask")}>
            {t.dashboard.mainTaskHeatmap} →
          </h3>
          <HeatmapGrid checkins={checkins} type="mainTask" />
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3 cursor-pointer hover:text-accent transition-colors" onClick={() => openHeatmapModal("allTasks")}>
            {t.dashboard.allTasksHeatmap} →
          </h3>
          <HeatmapGrid checkins={checkins} type="allTasks" />
        </div>
      </div>

      <Dialog.Root open={heatmapModalType !== null} onOpenChange={() => setHeatmapModalType(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">
                {heatmapModalType === "mainTask" ? t.dashboard.mainTaskHeatmap : t.dashboard.allTasksHeatmap} — Прогресс с начала года
              </Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-bg-elevated rounded-lg p-3 text-center">
                <div className="text-xl font-mono font-bold text-accent">{yearStats.total}</div>
                <div className="text-xs text-text-dim">Чек-инов</div>
              </div>
              <div className="bg-bg-elevated rounded-lg p-3 text-center">
                <div className="text-xl font-mono font-bold text-green-400">{yearStats.mainDone}</div>
                <div className="text-xs text-text-dim">Главная задача</div>
              </div>
              <div className="bg-bg-elevated rounded-lg p-3 text-center">
                <div className="text-xl font-mono font-bold text-blue-400">{yearStats.fullDone}</div>
                <div className="text-xs text-text-dim">100% дней</div>
              </div>
              <div className="bg-bg-elevated rounded-lg p-3 text-center">
                <div className="text-xl font-mono font-bold text-purple-400">{yearStats.rate}%</div>
                <div className="text-xs text-text-dim">Показатель</div>
              </div>
            </div>

            <HeatmapGrid checkins={yearCheckins} type={heatmapModalType || "mainTask"} days={365} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function MiniRadar({ blocks }: { blocks: BlockData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || blocks.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const size = 160;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 20;
    const n = blocks.length;

    ctx.clearRect(0, 0, size, size);

    // Grid rings
    for (let ring = 1; ring <= 5; ring++) {
      const r = (R * ring) / 5;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axes
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.stroke();
    }

    // Data polygon
    ctx.beginPath();
    blocks.forEach((b, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = R * (b.percentage / 100);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Points + emoji labels
    blocks.forEach((b, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = R * (b.percentage / 100);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = BLOCK_COLORS[b.block];
      ctx.fill();

      // Emoji at edge
      const lx = cx + (R + 12) * Math.cos(angle);
      const ly = cy + (R + 12) * Math.sin(angle);
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(BLOCK_ICONS[b.block], lx, ly);
    });
  }, [blocks]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={canvasRef} style={{ width: 160, height: 160 }} />;
}

function HeatmapGrid({ checkins, type, days = 90 }: { checkins: CheckinData[]; type: "mainTask" | "allTasks"; days?: number }) {
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const cells = [];
  const checkinMap = new Map<string, CheckinData>();
  checkins.forEach((c) => { checkinMap.set(toLocal(new Date(c.date)), c); });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = toLocal(d);
    const dayNum = d.getDate();
    const checkin = checkinMap.get(key);
    let filled = false;

    if (checkin) {
      if (type === "mainTask") { filled = checkin.mainTaskDone; }
      else {
        const ratio = checkin.totalTasks > 0 ? checkin.completedTasks / checkin.totalTasks : 0;
        filled = ratio > 0;
      }
    }

    const bgColor = filled ? "#22c55e" : "#1a1a25";

    cells.push(
      <div
        key={key}
        className={`w-6 h-6 rounded-sm relative flex items-center justify-center ${i === 0 ? "ring-1 ring-accent" : ""}`}
        style={{ backgroundColor: bgColor }}
        title={key}
      >
        <span className={`text-[8px] font-mono leading-none ${filled ? "text-black/70 font-semibold" : "text-text-dim/40"}`}>
          {dayNum}
        </span>
        {/* Strikethrough for empty days */}
        {!filled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-px bg-text-dim/20" />
          </div>
        )}
      </div>
    );
  }
  return <div className="flex flex-wrap gap-1">{cells}</div>;
}
