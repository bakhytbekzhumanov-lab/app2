"use client";

import { useState, useEffect, useCallback } from "react";
// Energy max is always 100
import { useLocale } from "@/hooks/useLocale";
import { Zap } from "lucide-react";

const ENERGY_BLUE = "#38bdf8";

interface EnergyData {
  currentEnergy: number;
  baseEnergy: number;
  morningDone: boolean;
  isBurnout: boolean;
}

export default function EnergyBar() {
  const { locale } = useLocale();
  const [energy, setEnergy] = useState<EnergyData | null>(null);

  const fetchEnergy = useCallback(async () => {
    try {
      const res = await fetch("/api/energy");
      if (res.ok) setEnergy(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchEnergy();
    const interval = setInterval(fetchEnergy, 60000);
    return () => clearInterval(interval);
  }, [fetchEnergy]);

  if (!energy) return null;

  const pct = Math.max(0, Math.min((energy.currentEnergy / 100) * 100, 100));

  return (
    <div className="flex items-center gap-2" title={`${energy.currentEnergy}/100 EP`}>
      {energy.isBurnout && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">
          🔥 {locale === "ru" ? "Выгорание" : "Burnout"}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <Zap className="w-4 h-4" style={{ color: ENERGY_BLUE }} />
        <div className="w-16 h-2 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: ENERGY_BLUE }}
          />
        </div>
        <span className="text-xs font-mono font-medium" style={{ color: ENERGY_BLUE }}>
          {energy.currentEnergy}
        </span>
      </div>
    </div>
  );
}
