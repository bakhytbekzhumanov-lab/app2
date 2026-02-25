"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { AVATAR_TITLES } from "@/lib/xp";
import { toast } from "sonner";
import { Flame, Zap, Target, Trophy, Settings, Medal, Globe } from "lucide-react";

interface ProfileData {
  id: string;
  nickname: string;
  email: string;
  totalXp: number;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  avatarStage: number;
  locale: string;
  createdAt: string;
  level: { level: number; currentXP: number; nextLevelXP: number; progress: number };
  achievements: { id: string; achievement: { id: string; name: string; description: string; icon: string; xpReward: number }; unlockedAt: string }[];
}

export default function ProfilePage() {
  const { t, locale, setLocale } = useLocale();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nickname, setNickname] = useState("");
  const [editing, setEditing] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) { const data = await res.json(); setProfile(data); setNickname(data.nickname); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveNickname = async () => {
    if (!nickname.trim()) return;
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname }) });
    if (res.ok) { toast.success("Saved!"); setEditing(false); fetchProfile(); }
  };

  const changeLocale = async (newLocale: string) => {
    setLocale(newLocale as "ru" | "en" | "kz");
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: newLocale }) });
  };

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 w-full" />)}
      </div>
    );
  }

  const lvl = profile.level;
  const title = AVATAR_TITLES[lvl.level] || "Adventurer";
  const daysSinceJoin = Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="#4ade80" strokeWidth="5"
              strokeDasharray={`${lvl.progress * 263.9} 263.9`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-mono font-bold">{lvl.level}</span>
        </div>

        {editing ? (
          <div className="flex items-center justify-center gap-2 mb-2">
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="bg-bg-elevated border border-border rounded-lg py-1.5 px-3 text-center text-lg font-semibold focus:outline-none focus:border-accent/50" autoFocus />
            <button onClick={saveNickname} className="px-3 py-1.5 bg-accent text-bg rounded-lg text-sm font-medium">{t.common.save}</button>
            <button onClick={() => { setEditing(false); setNickname(profile.nickname); }} className="px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-sm">{t.common.cancel}</button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold cursor-pointer hover:text-accent transition-colors" onClick={() => setEditing(true)}>
            {profile.nickname}
          </h1>
        )}
        <p className="text-sm text-text-dim">{title}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-xs font-mono text-text-dim">{lvl.currentXP} / {lvl.nextLevelXP} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Zap className="w-4 h-4 text-accent" />} label="Total XP" value={profile.totalXp.toLocaleString()} />
        <StatCard icon={<Target className="w-4 h-4 text-yellow-400" />} label={t.common.coins} value={profile.totalCoins.toLocaleString()} />
        <StatCard icon={<Flame className="w-4 h-4 text-orange-400" />} label={t.common.streak} value={`${profile.currentStreak} / ${profile.longestStreak}`} />
        <StatCard icon={<Trophy className="w-4 h-4 text-purple-400" />} label="Days" value={daysSinceJoin.toString()} />
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-medium mb-4"><Medal className="w-4 h-4" />{t.profile.achievements}</h3>
        {profile.achievements.length === 0 ? (
          <p className="text-sm text-text-dim text-center py-4">{t.common.noData}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profile.achievements.map((ua) => (
              <div key={ua.id} className="bg-bg-elevated rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">{ua.achievement.icon}</div>
                <div className="text-sm font-medium">{ua.achievement.name}</div>
                <div className="text-xs text-text-dim mt-0.5">{ua.achievement.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-medium mb-4"><Settings className="w-4 h-4" />{t.profile.settings}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-text-dim" />
              <span className="text-sm">{t.profile.language}</span>
            </div>
            <div className="flex gap-2">
              {(["ru", "en", "kz"] as const).map((lang) => (
                <button key={lang} onClick={() => changeLocale(lang)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${locale === lang ? "bg-accent/20 text-accent border border-accent/30" : "bg-bg-elevated text-text-dim border border-border"}`}>
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-dim">Email</span>
            <span className="text-sm">{profile.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 text-text-dim text-xs mb-2">{icon}{label}</div>
      <div className="text-xl font-mono font-bold">{value}</div>
    </div>
  );
}
