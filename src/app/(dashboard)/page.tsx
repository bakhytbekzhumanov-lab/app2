"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS, BLOCK_ICONS } from "@/types";
import type { Block } from "@prisma/client";
import { Flame, Zap, Target, Repeat } from "lucide-react";

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

export default function HomePage() {
  const { t } = useLocale();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [todayStats, setTodayStats] = useState({ xp: 0, actions: 0, habits: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/weekly").then((r) => r.json()),
      fetch("/api/profile/checkins?range=90").then((r) => r.json()),
      fetch(`/api/logs?date=${new Date().toISOString().split("T")[0]}`).then((r) => r.json()),
    ]).then(([prof, weekly, chk, logs]) => {
      setProfile(prof);
      setBlocks(weekly.blocks || []);
      setCheckins(Array.isArray(chk) ? chk : []);
      setTodayStats({
        xp: Array.isArray(logs) ? logs.reduce((s: number, l: { xpAwarded: number }) => s + l.xpAwarded, 0) : 0,
        actions: Array.isArray(logs) ? logs.length : 0,
        habits: 0,
      });
    }).catch(() => {});
  }, []);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t.dashboard.greeting}, {profile.nickname}!
            </h1>
            <p className="text-text-dim text-sm mt-1">
              {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {profile.currentStreak > 0 && (
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-lg font-mono font-bold text-orange-400">{profile.currentStreak}</span>
              </div>
            )}
            <div className="text-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#4ade80" strokeWidth="4"
                    strokeDasharray={`${lvl.progress * 175.9} 175.9`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-bold">{lvl.level}</span>
              </div>
              <span className="text-xs text-text-dim">{t.common.level}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-dim text-sm mb-2"><Zap className="w-4 h-4 text-accent" />{t.dashboard.todayXP}</div>
          <div className="text-2xl font-mono font-bold text-accent">{todayStats.xp}</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-dim text-sm mb-2"><Target className="w-4 h-4 text-blue-400" />{t.dashboard.actionsToday}</div>
          <div className="text-2xl font-mono font-bold">{todayStats.actions}</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-dim text-sm mb-2"><Repeat className="w-4 h-4 text-purple-400" />{t.dashboard.habitsToday}</div>
          <div className="text-2xl font-mono font-bold">{todayStats.habits}</div>
        </div>
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
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.percentage}%`, backgroundColor: BLOCK_COLORS[b.block] }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3">{t.dashboard.mainTaskHeatmap}</h3>
          <HeatmapGrid checkins={checkins} type="mainTask" />
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3">{t.dashboard.allTasksHeatmap}</h3>
          <HeatmapGrid checkins={checkins} type="allTasks" />
        </div>
      </div>
    </div>
  );
}

function HeatmapGrid({ checkins, type }: { checkins: CheckinData[]; type: "mainTask" | "allTasks" }) {
  const days = 90;
  const cells = [];
  const checkinMap = new Map<string, CheckinData>();
  checkins.forEach((c) => { checkinMap.set(new Date(c.date).toISOString().split("T")[0], c); });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const checkin = checkinMap.get(key);
    let color = "#1a1a25";
    if (checkin) {
      if (type === "mainTask") { color = checkin.mainTaskDone ? "#22c55e" : "#ef4444"; }
      else {
        const ratio = checkin.totalTasks > 0 ? checkin.completedTasks / checkin.totalTasks : 0;
        color = ratio === 0 ? "#1a1a25" : ratio <= 0.25 ? "#166534" : ratio <= 0.5 ? "#22c55e80" : ratio <= 0.75 ? "#22c55e" : "#4ade80";
      }
    }
    cells.push(<div key={key} className={`w-3 h-3 rounded-sm ${i === 0 ? "ring-1 ring-accent" : ""}`} style={{ backgroundColor: color }} title={key} />);
  }
  return <div className="flex flex-wrap gap-1">{cells}</div>;
}
