"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS } from "@/types";
import type { Block, Difficulty } from "@prisma/client";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { Plus, Pencil, Trash2, Search, X, Upload } from "lucide-react";

interface ActionItem { id: string; name: string; block: Block; xp: number; difficulty: Difficulty; isActive: boolean; }
const BLOCKS: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];
const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD", "VERY_HARD", "LEGENDARY"];

export default function ActionsPage() {
  const { t } = useLocale();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterBlock, setFilterBlock] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [form, setForm] = useState({ name: "", block: "HEALTH" as Block, xp: 10, difficulty: "EASY" as Difficulty });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchActions = async () => { const res = await fetch("/api/actions"); const data = await res.json(); setActions(Array.isArray(data) ? data : []); };
  useEffect(() => { fetchActions(); }, []);

  const openCreate = () => { setEditingAction(null); setForm({ name: "", block: "HEALTH", xp: 10, difficulty: "EASY" }); setModalOpen(true); };
  const openEdit = (a: ActionItem) => { setEditingAction(a); setForm({ name: a.name, block: a.block, xp: a.xp, difficulty: a.difficulty }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingAction) { await fetch(`/api/actions/${editingAction.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); toast.success("Updated"); }
    else { await fetch("/api/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); toast.success("Created"); }
    setModalOpen(false); fetchActions();
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete?")) return; await fetch(`/api/actions/${id}`, { method: "DELETE" }); fetchActions(); };
  const toggleActive = async (a: ActionItem) => { await fetch(`/api/actions/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !a.isActive }) }); fetchActions(); };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/actions/import", { method: "POST", body: formData });
      const result = await res.json();

      if (result.imported > 0) {
        toast.success(`Импортировано ${result.imported} действий`);
        fetchActions();
      }
      if (result.errors > 0) {
        toast.error(`${result.errors} строк с ошибками`);
      }
      if (result.imported === 0 && result.errors === 0) {
        toast.error("Файл пуст или неверный формат");
      }
    } catch {
      toast.error("Ошибка импорта");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filtered = actions.filter((a) => filterBlock === "ALL" || a.block === filterBlock).filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.actions.title}</h1>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-bg-elevated border border-border text-text-mid px-4 py-2 rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors">
            <Upload className="w-4 h-4" />{t.actions.importCSV}
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90"><Plus className="w-4 h-4" />{t.actions.addAction}</button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="w-full bg-bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50" />
        </div>
        <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm">
          <option value="ALL">All blocks</option>
          {BLOCKS.map((b) => <option key={b} value={b}>{t.blocks[b]}</option>)}
        </select>
      </div>

      <div className="bg-bg-card border border-border rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-bg-card z-10"><tr className="border-b border-border text-left text-sm text-text-dim">
            <th className="px-4 py-3 font-medium">{t.actions.name}</th><th className="px-4 py-3 font-medium">{t.actions.block}</th>
            <th className="px-4 py-3 font-medium">{t.common.xp}</th><th className="px-4 py-3 font-medium">{t.actions.difficulty}</th>
            <th className="px-4 py-3 font-medium">{t.actions.active}</th><th className="px-4 py-3 font-medium w-24"></th>
          </tr></thead>
          <tbody>
            {filtered.map((action) => (
              <tr key={action.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors">
                <td className="px-4 py-3 text-sm">{action.name}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: BLOCK_COLORS[action.block] + "20", color: BLOCK_COLORS[action.block] }}>{t.blocks[action.block]}</span></td>
                <td className="px-4 py-3 text-sm font-mono text-accent">{action.xp}</td>
                <td className="px-4 py-3 text-sm text-text-mid">{t.difficulty[action.difficulty]}</td>
                <td className="px-4 py-3">
                  <Switch.Root checked={action.isActive} onCheckedChange={() => toggleActive(action)} className="w-9 h-5 rounded-full bg-bg-elevated data-[state=checked]:bg-accent/30 relative">
                    <Switch.Thumb className="block w-4 h-4 bg-text rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-accent" />
                  </Switch.Root>
                </td>
                <td className="px-4 py-3"><div className="flex items-center gap-1">
                  <button onClick={() => openEdit(action)} className="p-1.5 hover:bg-bg-elevated rounded text-text-dim"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(action.id)} className="p-1.5 hover:bg-red-500/10 rounded text-text-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-text-dim text-sm">{t.common.noData}</div>}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-text-dim">
          💡 CSV формат: <code className="bg-bg-elevated px-1 py-0.5 rounded text-accent">name,block,xp,difficulty</code>
          <br />Пример: <code className="bg-bg-elevated px-1 py-0.5 rounded">Утренняя зарядка,HEALTH,20,NORMAL</code>
          <br />Блоки: HEALTH, WORK, DEVELOPMENT, RELATIONSHIPS, FINANCE, SPIRITUALITY, BRIGHTNESS, HOME
        </p>
      </div>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">{editingAction ? t.common.edit : t.common.create}</Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm text-text-mid mb-1 block">{t.actions.name}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" /></div>
              <div><label className="text-sm text-text-mid mb-1 block">{t.actions.block}</label><select value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value as Block })} className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm">{BLOCKS.map((b) => <option key={b} value={b}>{t.blocks[b]}</option>)}</select></div>
              <div><label className="text-sm text-text-mid mb-1 block">{t.common.xp}</label><input type="number" value={form.xp} onChange={(e) => setForm({ ...form, xp: parseInt(e.target.value) || 0 })} className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" /></div>
              <div><label className="text-sm text-text-mid mb-1 block">{t.actions.difficulty}</label><select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm">{DIFFICULTIES.map((d) => <option key={d} value={d}>{t.difficulty[d]}</option>)}</select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <Dialog.Close className="flex-1 bg-bg-elevated border border-border rounded-lg py-2 text-sm">{t.common.cancel}</Dialog.Close>
              <button onClick={handleSave} className="flex-1 bg-accent text-bg rounded-lg py-2 text-sm font-medium hover:bg-accent/90">{t.common.save}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
