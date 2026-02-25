"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Coins, Check, Trash2 } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  coinCost: number;
  icon: string | null;
  isRedeemed: boolean;
  redeemedAt: string | null;
  createdAt: string;
}

interface ProfileData {
  totalCoins: number;
}

const EMOJI_OPTIONS = ["🎮", "🎬", "🍕", "☕", "🛒", "📱", "🎧", "📚", "🏖️", "💆", "🎂", "🎁", "🍫", "🎯", "⭐", "🌟"];

export default function RewardsPage() {
  const { t } = useLocale();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [coins, setCoins] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", coinCost: 50, icon: "🎁" });

  const fetchData = useCallback(async () => {
    const [rewardsRes, profileRes] = await Promise.all([fetch("/api/rewards"), fetch("/api/profile")]);
    if (rewardsRes.ok) setRewards(await rewardsRes.json());
    if (profileRes.ok) { const p: ProfileData = await profileRes.json(); setCoins(p.totalCoins); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createReward = async () => {
    if (!form.name.trim()) return;
    const res = await fetch("/api/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Reward created!"); setModalOpen(false); setForm({ name: "", description: "", coinCost: 50, icon: "🎁" }); fetchData(); }
  };

  const redeemReward = async (id: string, name: string, cost: number) => {
    if (coins < cost) { toast.error(t.rewards.notEnoughCoins); return; }
    if (!confirm(`Redeem "${name}" for ${cost} coins?`)) return;
    const res = await fetch(`/api/rewards/${id}/redeem`, { method: "POST" });
    if (res.ok) { toast.success(`${name} redeemed!`); fetchData(); }
  };

  const deleteReward = async (id: string) => {
    if (!confirm("Delete this reward?")) return;
    await fetch(`/api/rewards/${id}`, { method: "DELETE" });
    fetchData();
  };

  const available = rewards.filter((r) => !r.isRedeemed);
  const redeemed = rewards.filter((r) => r.isRedeemed);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.rewards.title}</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90">
          <Plus className="w-4 h-4" />{t.rewards.createReward}
        </button>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 flex items-center gap-4">
        <Coins className="w-8 h-8 text-yellow-400" />
        <div>
          <div className="text-3xl font-mono font-bold text-yellow-400">{coins}</div>
          <div className="text-xs text-text-dim">{t.rewards.coinBalance}</div>
        </div>
      </div>

      {available.length === 0 && redeemed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎁</div>
          <p className="text-text-dim">{t.common.noData}</p>
          <p className="text-xs text-text-dim mt-1">Create rewards to motivate yourself!</p>
        </div>
      ) : (
        <>
          {available.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-mid mb-3">Available</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {available.map((reward) => (
                  <div key={reward.id} className="bg-bg-card border border-border rounded-xl p-4 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{reward.icon || "🎁"}</div>
                      <button onClick={() => deleteReward(reward.id)} className="p-1 text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-medium text-sm mb-1">{reward.name}</h3>
                    {reward.description && <p className="text-xs text-text-dim mb-3">{reward.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm font-mono text-yellow-400">
                        <Coins className="w-3.5 h-3.5" />{reward.coinCost}
                      </span>
                      <button onClick={() => redeemReward(reward.id, reward.name, reward.coinCost)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          coins >= reward.coinCost
                            ? "bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30"
                            : "bg-bg-elevated text-text-dim border border-border cursor-not-allowed"
                        }`} disabled={coins < reward.coinCost}>
                        {t.rewards.redeem}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {redeemed.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-mid mb-3">{t.rewards.history}</h2>
              <div className="space-y-2">
                {redeemed.map((reward) => (
                  <div key={reward.id} className="bg-bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <span>{reward.icon || "🎁"}</span>
                      <span className="text-sm">{reward.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-text-dim">{reward.coinCost} coins</span>
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">{t.rewards.createReward}</Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-mid mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => setForm({ ...form, icon: emoji })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${form.icon === emoji ? "bg-accent/20 border border-accent/30" : "bg-bg-elevated border border-border"}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">{t.rewards.cost} (coins)</label>
                <input type="number" value={form.coinCost} onChange={(e) => setForm({ ...form, coinCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Dialog.Close className="flex-1 bg-bg-elevated border border-border rounded-lg py-2 text-sm">{t.common.cancel}</Dialog.Close>
              <button onClick={createReward} className="flex-1 bg-accent text-bg rounded-lg py-2 text-sm font-medium hover:bg-accent/90">{t.common.create}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
