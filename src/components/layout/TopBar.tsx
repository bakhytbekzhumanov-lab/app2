"use client";

import { useUser } from "@/hooks/useUser";
import { useLocale } from "@/hooks/useLocale";
import { signOut } from "next-auth/react";
import { LogOut, Flame, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import EnergyBar from "@/components/EnergyBar";

interface TopBarProps {
  nickname?: string;
  streak?: number;
  level?: number;
  isGuest?: boolean;
}

export default function TopBar({ nickname, streak = 0, level = 1, isGuest = false }: TopBarProps) {
  const { user } = useUser();
  const { t } = useLocale();

  return (
    <header className="h-14 border-b border-border bg-bg-card/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {streak > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-mono text-orange-400">{streak}</span>
          </div>
        )}
        <EnergyBar />
      </div>

      <div className="flex items-center gap-3">
        {isGuest ? (
          <>
            <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded font-medium">
              ⏳ Guest · 15 min
            </span>
            <Link
              href="/signin"
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">{t.auth?.signIn || "Sign In"}</span>
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 text-sm bg-accent text-bg px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t.auth?.signUp || "Sign Up"}</span>
            </Link>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </header>
  );
}
