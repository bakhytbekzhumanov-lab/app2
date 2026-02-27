"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { LogOut, Download, FileText, ChevronDown } from "lucide-react";
import Link from "next/link";

const TIMEZONES = [
  "Asia/Almaty", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Bishkek",
  "Asia/Tashkent", "Asia/Yekaterinburg", "Asia/Novosibirsk", "Asia/Krasnoyarsk",
  "Asia/Dubai", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Asia/Kolkata",
  "Europe/Moscow", "Europe/London", "Europe/Berlin", "Europe/Istanbul",
  "America/New_York", "America/Chicago", "America/Los_Angeles", "Pacific/Auckland",
];

interface ProfileData {
  id: string;
  name: string | null;
  nickname: string;
  email: string;
  phone: string | null;
  timezone: string;
  locale: string;
  totalXp: number;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  avatarStage: number;
  createdAt: string;
  level: { level: number; currentXP: number; nextLevelXP: number; progress: number };
}

export default function ProfilePage() {
  const { locale, setLocale } = useLocale();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ name: "", nickname: "", phone: "", timezone: "Asia/Almaty" });
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setForm({
        name: data.name || "",
        nickname: data.nickname || "",
        phone: data.phone || "",
        timezone: data.timezone || "Asia/Almaty",
      });
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) toast.success(locale === "ru" ? "Сохранено!" : "Saved!");
    setSaving(false);
  };

  const changeLocale = async (newLocale: string) => {
    setLocale(newLocale as "ru" | "en" | "kz");
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: newLocale }) });
  };

  const exportData = async () => {
    const res = await fetch("/api/profile/export");
    if (!res.ok) { toast.error("Export failed"); return; }
    const data = await res.json();

    // Create downloadable ZIP-like bundle of CSVs
    const files = [
      { name: "actions.csv", content: data.actions },
      { name: "logs.csv", content: data.logs },
      { name: "habits.csv", content: data.habits },
      { name: "habit_logs.csv", content: data.habitLogs },
    ];
    for (const f of files) {
      const blob = new Blob([f.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name; a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(locale === "ru" ? "Данные экспортированы!" : "Data exported!");
  };

  const clearActions = async () => {
    if (!confirm(locale === "ru" ? "Удалить ВСЕ действия и связанные логи? Это необратимо!" : "Delete ALL actions and related logs? This is irreversible!")) return;
    const res = await fetch("/api/profile/clear-actions", { method: "DELETE" });
    if (res.ok) { toast.success(locale === "ru" ? "Действия удалены" : "Actions cleared"); fetchProfile(); }
  };

  const resetProgress = async () => {
    if (!confirm(locale === "ru" ? "Сбросить ВСЕ: XP, уровень, серию, логи, привычки? Это необратимо!" : "Reset ALL: XP, level, streak, logs, habits? This is irreversible!")) return;
    const res = await fetch("/api/profile/reset-progress", { method: "DELETE" });
    if (res.ok) { toast.success(locale === "ru" ? "Прогресс сброшен" : "Progress reset"); fetchProfile(); }
  };

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  const initial = (profile.nickname || profile.email)[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{locale === "ru" ? "Настройки" : locale === "kz" ? "Баптаулар" : "Settings"}</h1>
        <p className="text-sm text-text-dim mt-0.5">
          {locale === "ru" ? "Профиль и контакты" : "Profile data and contacts"}
        </p>
      </div>

      {/* PROFILE SECTION */}
      <div>
        <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">
          {locale === "ru" ? "Профиль" : "Profile"}
        </p>

        {/* Avatar row */}
        <div className="bg-bg-card border border-border rounded-xl p-4 mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center text-lg font-bold flex-shrink-0">
            {initial}
          </div>
          <div>
            <div className="font-semibold">{profile.nickname}</div>
            <div className="text-sm text-text-dim">{profile.email}</div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
                {locale === "ru" ? "Имя" : "Name"}
              </label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-bg-card border border-border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
                {locale === "ru" ? "Никнейм" : "Nickname"}
              </label>
              <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="w-full bg-bg-card border border-border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-dim uppercase tracking-wider mb-1.5 block">Email</label>
              <input value={profile.email} disabled
                className="w-full bg-bg-card border border-border rounded-lg py-2.5 px-3 text-sm text-text-dim cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
                {locale === "ru" ? "Телефон" : "Phone"}
              </label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 (999) 000-00-00"
                className="w-full bg-bg-card border border-border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
              {locale === "ru" ? "Часовой пояс" : "Timezone"}
            </label>
            <div className="relative">
              <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full bg-bg-card border border-border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-accent/50 appearance-none pr-10">
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-text-dim absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-text-dim mt-1">
              {locale === "ru" ? "Привычки и дневные цели используют этот пояс" : "Habits and daily goals use this timezone"}
            </p>
          </div>

          <button onClick={saveProfile} disabled={saving}
            className="w-full bg-accent text-bg py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
            {saving ? "..." : (locale === "ru" ? "Сохранить" : "Save")}
          </button>
        </div>
      </div>

      {/* LANGUAGE */}
      <div>
        <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
          {locale === "ru" ? "Язык" : "Language"}
        </p>
        <p className="text-xs text-text-dim mb-3">
          {locale === "ru" ? "Выберите язык интерфейса" : "Choose interface language"}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: "en" as const, label: "English" },
            { key: "ru" as const, label: "Русский" },
            { key: "kz" as const, label: "Қазақша" },
          ]).map((lang) => (
            <button key={lang.key} onClick={() => changeLocale(lang.key)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                locale === lang.key
                  ? "bg-accent text-bg"
                  : "bg-bg-card border border-border text-text-dim hover:text-text"
              }`}>
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* DATA & PRIVACY */}
      <div>
        <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
          {locale === "ru" ? "Данные и приватность" : "Data & Privacy"}
        </p>
        <p className="text-xs text-text-dim mb-3">
          {locale === "ru" ? "Управление вашими данными" : "Manage your data"}
        </p>
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-text-dim mb-3">
            {locale === "ru"
              ? "Скачать CSV файлы: actions, logs, habits, habit_logs"
              : "Download a ZIP with CSV files: actions, logs, habits, habit_logs"}
          </p>
          <button onClick={exportData}
            className="flex items-center gap-2 bg-bg-elevated border border-border px-4 py-2 rounded-lg text-sm font-medium hover:text-accent transition-colors">
            <Download className="w-4 h-4" />
            {locale === "ru" ? "Экспорт данных" : "Export all data"}
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div>
        <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
          {locale === "ru" ? "Уведомления" : "Notifications"}
        </p>
        <p className="text-xs text-text-dim mb-3">
          {locale === "ru" ? "Push-уведомления скоро будут доступны" : "Push notifications will be available soon"}
        </p>
        <div className="space-y-2">
          {[
            { label: locale === "ru" ? "Напоминание о привычках" : "Daily habit reminder" },
            { label: locale === "ru" ? "Итоги дня" : "Daily summary" },
            { label: locale === "ru" ? "Предупреждение о серии" : "Streak warning" },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3">
              <span className="text-sm">{n.label}</span>
              <div className="w-10 h-5 bg-bg-elevated rounded-full relative cursor-not-allowed opacity-50">
                <div className="w-4 h-4 bg-text-dim rounded-full absolute top-0.5 left-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOG OUT */}
      <button onClick={() => signOut({ callbackUrl: "/signin" })}
        className="w-full flex items-center justify-center gap-2 bg-bg-card border border-border rounded-xl py-3 text-sm font-medium hover:bg-bg-card-hover transition-colors">
        <LogOut className="w-4 h-4" />
        {locale === "ru" ? "Выйти" : locale === "kz" ? "Шығу" : "Log out"}
      </button>

      {/* CHANGELOG link */}
      <Link href="/changelog" className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3 hover:bg-bg-card-hover transition-colors">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-dim" />
          <span className="text-sm">{locale === "ru" ? "Что нового" : "What's new"}</span>
        </div>
        <span className="text-xs text-text-dim">v0.2.0</span>
      </Link>

      {/* DANGER ZONE */}
      <div className="border border-red-500/30 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider">
            {locale === "ru" ? "Опасная зона" : "Danger Zone"}
          </p>
          <p className="text-xs text-text-dim mt-0.5">
            {locale === "ru" ? "Необратимые действия. Будьте осторожны." : "Irreversible actions. Be careful."}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{locale === "ru" ? "Очистить действия" : "Clear all actions"}</p>
            <p className="text-xs text-text-dim">{locale === "ru" ? "Удалить все действия и связанные логи" : "Delete all your actions and related logs"}</p>
          </div>
          <button onClick={clearActions}
            className="flex-shrink-0 px-3 py-1.5 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors">
            {locale === "ru" ? "Очистить" : "Clear all actions"}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{locale === "ru" ? "Сбросить прогресс" : "Reset all progress"}</p>
            <p className="text-xs text-text-dim">{locale === "ru" ? "Сбросить XP, уровень, серию, логи" : "Reset XP, level, streak, logs, and habit progress"}</p>
          </div>
          <button onClick={resetProgress}
            className="flex-shrink-0 px-3 py-1.5 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors">
            {locale === "ru" ? "Сбросить" : "Reset all progress"}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{locale === "ru" ? "Удалить аккаунт" : "Delete account"}</p>
            <p className="text-xs text-text-dim">{locale === "ru" ? "Навсегда удалить аккаунт и все данные" : "Permanently delete your account and all data"}</p>
          </div>
          <button onClick={() => toast.error(locale === "ru" ? "Напишите в поддержку для удаления аккаунта" : "Contact support to delete your account")}
            className="flex-shrink-0 px-3 py-1.5 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors">
            {locale === "ru" ? "Удалить аккаунт" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}
