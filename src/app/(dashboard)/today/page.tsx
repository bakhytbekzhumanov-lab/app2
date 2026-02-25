"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS, BLOCK_ICONS } from "@/types";
import type { Block } from "@prisma/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, Trash2, CheckCircle } from "lucide-react";

interface ActionItem { id: string; name: string; block: Block; xp: number; difficulty: string; isActive?: boolean; }
interface LogItem { id: string; actionId: string; xpAwarded: number; date: string; note: string | null; action: ActionItem; createdAt: string; }

export default function TodayPage() {
  const { t } = useLocale();
  const [date, setDate] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [search, setSearch] = useState("");
  const [xpToday, setXpToday] = useState(0);
  const [mainTaskDone, setMainTaskDone] = useState(false);
  const dateStr = date.toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    try {
      const [actRes, logRes] = await Promise.all([fetch("/api/actions"), fetch(`/api/logs?date=${dateStr}`)]);
      const actData = await actRes.json();
      const logData = await logRes.json();
      setActions(Array.isArray(actData) ? actData.filter((a: ActionItem) => a.isActive !== false) : []);
      const validLogs = Array.isArray(logData) ? logData : [];
      setLogs(validLogs);
      setXpToday(validLogs.reduce((s: number, l: LogItem) => s + l.xpAwarded, 0));
    } catch {}
  }, [dateStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const logAction = async (actionId: string) => {
    const res = await fetch("/api/logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId, date: dateStr }) });
    if (res.ok) { const data = await res.json(); toast.success(`+${data.xpAwarded} XP`); if (data.coinBonus > 0) toast.success(`+${data.coinBonus} coins!`); fetchData(); }
  };

  const deleteLog = async (logId: string) => { await fetch(`/api/logs/${logId}`, { method: "DELETE" }); fetchData(); };

  const saveCheckin = async () => {
    await fetch("/api/profile/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: dateStr, mainTaskDone, totalTasks: actions.length, completedTasks: logs.length, xpEarned: xpToday }) });
    toast.success("Check-in saved!");
  };

  const grouped = actions.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())).reduce<Record<string, ActionItem[]>>((acc, a) => { (acc[a.block] = acc[a.block] || []).push(a); return acc; }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d); }} className="p-2 rounded-lg hover:bg-bg-elevated"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-semibold">{date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</h1>
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d); }} className="p-2 rounded-lg hover:bg-bg-elevated"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-accent">{xpToday}</div>
          <div className="text-xs text-text-dim">{t.common.xp}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="w-full bg-bg-card border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50" />
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([block, blockActions]) => (
          <div key={block}>
            <div className="flex items-center gap-2 mb-2">
              <span>{BLOCK_ICONS[block as Block]}</span>
              <span className="text-sm font-medium" style={{ color: BLOCK_COLORS[block as Block] }}>{t.blocks[block as Block]}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {blockActions.map((action) => (
                <button key={action.id} onClick={() => logAction(action.id)} className="bg-bg-card border border-border rounded-lg p-3 text-left hover:bg-bg-card-hover hover:border-border-hover transition-all">
                  <div className="text-sm font-medium truncate">{action.name}</div>
                  <div className="text-xs text-text-dim mt-1 font-mono">+{action.xp} XP</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">{t.today.dailyCheckin}</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-mid">{t.today.mainTaskQuestion}</span>
          <button onClick={() => setMainTaskDone(!mainTaskDone)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mainTaskDone ? "bg-accent/20 text-accent border border-accent/30" : "bg-bg-elevated text-text-dim border border-border"}`}>
            {mainTaskDone ? t.common.yes : t.common.no}
          </button>
          <button onClick={saveCheckin} className="ml-auto px-4 py-1.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90">{t.common.save}</button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">{t.today.todayLog}</h3>
        {logs.length === 0 ? <div className="text-center py-8 text-text-dim text-sm">{t.common.noData}</div> : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm">{log.action.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: BLOCK_COLORS[log.action.block] + "20", color: BLOCK_COLORS[log.action.block] }}>{t.blocks[log.action.block]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-accent">+{log.xpAwarded} XP</span>
                  <button onClick={() => deleteLog(log.id)} className="p-1 hover:text-red-400 text-text-dim"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
