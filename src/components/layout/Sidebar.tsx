"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  KanbanSquare,
  Zap,
  BarChart3,
  Repeat,
  User,
  Gift,
  ChevronLeft,
  ChevronRight,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, key: "home" as const },
  { href: "/today", icon: CalendarCheck, key: "today" as const },
  { href: "/kanban", icon: KanbanSquare, key: "kanban" as const },
  { href: "/actions", icon: Zap, key: "actions" as const },
  { href: "/weekly", icon: BarChart3, key: "weekly" as const },
  { href: "/habits", icon: Repeat, key: "habits" as const },
  { href: "/profile", icon: User, key: "profile" as const },
  { href: "/rewards", icon: Gift, key: "rewards" as const },
];

interface SidebarProps {
  isGuest?: boolean;
}

export default function Sidebar({ isGuest = false }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-bg-card border-r border-border flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <Link href="/" className="text-lg font-bold text-accent">
            Life RPG
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-bg-elevated transition-colors text-text-dim"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-dim hover:text-text hover:bg-bg-elevated"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t.nav[item.key]}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2 space-y-1 border-t border-border pt-2">
        {isGuest && (
          <>
            <Link
              href="/signin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                "text-accent hover:bg-accent/10"
              )}
            >
              <LogIn className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t.auth?.signIn || "Sign In"}</span>}
            </Link>
            <Link
              href="/register"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                "text-green-400 hover:bg-green-400/10"
              )}
            >
              <UserPlus className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t.auth?.signUp || "Sign Up"}</span>}
            </Link>
          </>
        )}
        <div className="px-3 py-2">
          {!collapsed && (
            <div className="text-xs text-text-dim">
              Life RPG v0.3
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
