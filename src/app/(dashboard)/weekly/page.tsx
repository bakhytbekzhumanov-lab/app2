"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS, BLOCK_ICONS } from "@/types";
import type { Block } from "@prisma/client";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BlockData {
  block: Block;
  xp: number;
  cap: number;
  percentage: number;
  trend: "up" | "down" | "same";
}

interface WeeklyData {
  blocks: BlockData[];
  totalXpWeek: number;
  weekStart: string;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function WeeklyPage() {
  const { t } = useLocale();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [data, setData] = useState<WeeklyData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/weekly?weekStart=${weekStart.toISOString().split("T")[0]}`);
    if (res.ok) setData(await res.json());
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    drawRadar(canvasRef.current, data.blocks, t);
  }, [data, t]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.weekly.title}</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-bg-elevated"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-medium">
            {weekStart.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} — {weekEnd.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
          </span>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-bg-elevated"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">{t.weekly.balanceWheel}</h3>
          <div className="flex justify-center">
            <canvas ref={canvasRef} width={320} height={320} />
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">{t.weekly.blockDetails}</h3>
          <div className="space-y-3">
            {data.blocks.map((b) => (
              <div key={b.block} className="flex items-center gap-3">
                <span className="text-lg">{BLOCK_ICONS[b.block]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: BLOCK_COLORS[b.block] }}>{t.blocks[b.block]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-dim">{b.xp}/{b.cap}</span>
                      {b.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> :
                       b.trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
                       <Minus className="w-3.5 h-3.5 text-text-dim" />}
                    </div>
                  </div>
                  <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.percentage}%`, backgroundColor: BLOCK_COLORS[b.block] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-mono font-bold text-accent">{data.totalXpWeek}</div>
          <div className="text-xs text-text-dim mt-1">{t.common.xp} this week</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-mono font-bold">{data.blocks.filter((b) => b.percentage >= 80).length}/8</div>
          <div className="text-xs text-text-dim mt-1">Blocks &ge; 80%</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-mono font-bold">{Math.round(data.blocks.reduce((s, b) => s + b.percentage, 0) / 8)}%</div>
          <div className="text-xs text-text-dim mt-1">Average Balance</div>
        </div>
      </div>
    </div>
  );
}

function drawRadar(canvas: HTMLCanvasElement, blocks: BlockData[], t: Record<string, Record<string, string>>) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(cx, cy) - 40;
  const n = blocks.length;

  ctx.clearRect(0, 0, W, H);

  // Grid rings
  for (let ring = 1; ring <= 5; ring++) {
    const r = (R * ring) / 5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
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
    if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Data points + Labels
  blocks.forEach((b, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = R * (b.percentage / 100);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = BLOCK_COLORS[b.block];
    ctx.fill();

    // Labels
    const lx = cx + (R + 20) * Math.cos(angle);
    const ly = cy + (R + 20) * Math.sin(angle);
    ctx.font = "11px sans-serif";
    ctx.fillStyle = BLOCK_COLORS[b.block];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const blockKey = b.block as keyof typeof t.blocks;
    ctx.fillText(t.blocks[blockKey] || b.block, lx, ly);
  });
}
