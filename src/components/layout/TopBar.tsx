"use client";

import { useUser } from "@/hooks/useUser";
import { signOut } from "next-auth/react";
import { LogOut, Flame } from "lucide-react";

interface TopBarProps {
  nickname?: string;
  streak?: number;
  level?: number;
}

export default function TopBar({ nickname, streak = 0, level = 1 }: TopBarProps) {
  const { user } = useUser();

  return (
    <header className="h-14 border-b border-border bg-bg-card/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {streak > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-mono text-orange-400">{streak}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-text-dim">
          {nickname || user?.name || user?.email?.split("@")[0]}
          <span className="ml-2 text-xs text-accent font-mono">Lv.{level}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="p-2 rounded-lg hover:bg-bg-elevated transition-colors text-text-dim hover:text-text"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
