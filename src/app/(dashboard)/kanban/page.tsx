"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { BLOCK_COLORS, BLOCK_ICONS } from "@/types";
import type { Block, KanbanStatus, TaskOwner } from "@prisma/client";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Trash2, GripVertical, LayoutGrid, Columns3 } from "lucide-react";
import { calcKanbanXP } from "@/lib/xp";

interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  status: KanbanStatus;
  owner: TaskOwner;
  importance: number;
  discomfort: number;
  urgency: number;
  block: Block | null;
  delegatedTo: string | null;
  dueDate: string | null;
  position: number;
  xpAwarded: number;
}

const COLUMNS: KanbanStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"];
const BLOCKS: Block[] = ["HEALTH", "WORK", "DEVELOPMENT", "RELATIONSHIPS", "FINANCE", "SPIRITUALITY", "BRIGHTNESS", "HOME"];
const OWNERS: TaskOwner[] = ["MINE", "DELEGATED", "STUCK"];

const COLUMN_LABELS: Record<string, string> = {
  BACKLOG: "backlog", TODO: "todo", IN_PROGRESS: "inProgress", DONE: "done",
};

export default function KanbanPage() {
  const { t } = useLocale();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [view, setView] = useState<"board" | "matrix">("board");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", status: "BACKLOG" as KanbanStatus, owner: "MINE" as TaskOwner,
    importance: 5, discomfort: 5, urgency: 5, block: null as Block | null, delegatedTo: "", dueDate: "",
  });

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/kanban");
    if (res.ok) setTasks(await res.json());
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = (status: KanbanStatus = "BACKLOG") => {
    setEditingTask(null);
    setForm({ title: "", description: "", status, owner: "MINE", importance: 5, discomfort: 5, urgency: 5, block: null, delegatedTo: "", dueDate: "" });
    setModalOpen(true);
  };

  const openEdit = (task: KanbanTask) => {
    setEditingTask(task);
    setForm({
      title: task.title, description: task.description || "", status: task.status, owner: task.owner,
      importance: task.importance, discomfort: task.discomfort, urgency: task.urgency,
      block: task.block, delegatedTo: task.delegatedTo || "", dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const body = { ...form, block: form.block || undefined, delegatedTo: form.delegatedTo || null, dueDate: form.dueDate || null };
    if (editingTask) {
      await fetch(`/api/kanban/${editingTask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      toast.success("Updated");
    } else {
      await fetch("/api/kanban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      toast.success("Created");
    }
    setModalOpen(false);
    fetchTasks();
  };

  const moveTask = async (taskId: string, newStatus: KanbanStatus) => {
    const res = await fetch(`/api/kanban/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    if (res.ok) {
      const data = await res.json();
      if (newStatus === "DONE" && data.xpAwarded > 0) toast.success(`+${data.xpAwarded} XP!`);
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/kanban/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const xpPreview = calcKanbanXP(form.importance, form.discomfort, form.urgency);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.kanban.title}</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-card border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView("board")} className={`px-3 py-1.5 text-sm ${view === "board" ? "bg-accent/20 text-accent" : "text-text-dim"}`}>
              <Columns3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView("matrix")} className={`px-3 py-1.5 text-sm ${view === "matrix" ? "bg-accent/20 text-accent" : "text-text-dim"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => openCreate()} className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90">
            <Plus className="w-4 h-4" />{t.kanban.newTask}
          </button>
        </div>
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-mid">{t.kanban[COLUMN_LABELS[col]]}</h3>
                  <span className="text-xs text-text-dim font-mono">{colTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} t={t} onEdit={openEdit} onDelete={deleteTask} onMove={moveTask} columns={COLUMNS} />
                  ))}
                  {col !== "DONE" && (
                    <button onClick={() => openCreate(col)} className="w-full border border-dashed border-border rounded-lg py-3 text-xs text-text-dim hover:border-accent/30 hover:text-text-mid transition-colors">
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <MatrixView tasks={tasks} t={t} onEdit={openEdit} />
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">{editingTask ? t.common.edit : t.kanban.newTask}</Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-mid mb-1 block">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="text-sm text-text-mid mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-mid mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as KanbanStatus })}
                    className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm">
                    {COLUMNS.map((s) => <option key={s} value={s}>{t.kanban[COLUMN_LABELS[s]]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-mid mb-1 block">Owner</label>
                  <select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value as TaskOwner })}
                    className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm">
                    {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-text-mid mb-1 block">{t.kanban.importance} ({form.importance})</label>
                  <input type="range" min={1} max={10} value={form.importance} onChange={(e) => setForm({ ...form, importance: parseInt(e.target.value) })} className="w-full accent-accent" />
                </div>
                <div>
                  <label className="text-sm text-text-mid mb-1 block">{t.kanban.discomfort} ({form.discomfort})</label>
                  <input type="range" min={1} max={10} value={form.discomfort} onChange={(e) => setForm({ ...form, discomfort: parseInt(e.target.value) })} className="w-full accent-accent" />
                </div>
                <div>
                  <label className="text-sm text-text-mid mb-1 block">{t.kanban.urgency} ({form.urgency})</label>
                  <input type="range" min={1} max={10} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: parseInt(e.target.value) })} className="w-full accent-accent" />
                </div>
              </div>
              <div className="text-center text-sm">
                Estimated XP: <span className="font-mono font-bold text-accent">{xpPreview}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-mid mb-1 block">Block</label>
                  <select value={form.block || ""} onChange={(e) => setForm({ ...form, block: e.target.value ? e.target.value as Block : null })}
                    className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm">
                    <option value="">None</option>
                    {BLOCKS.map((b) => <option key={b} value={b}>{t.blocks[b]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-mid mb-1 block">{t.kanban.dueDate}</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
                </div>
              </div>
              {form.owner === "DELEGATED" && (
                <div>
                  <label className="text-sm text-text-mid mb-1 block">{t.kanban.delegatedTo}</label>
                  <input value={form.delegatedTo} onChange={(e) => setForm({ ...form, delegatedTo: e.target.value })}
                    className="w-full bg-bg-elevated border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent/50" />
                </div>
              )}
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

function TaskCard({ task, t, onEdit, onDelete, onMove, columns }: {
  task: KanbanTask; t: Record<string, Record<string, string>>; onEdit: (t: KanbanTask) => void;
  onDelete: (id: string) => void; onMove: (id: string, status: KanbanStatus) => void; columns: KanbanStatus[];
}) {
  const currentIdx = columns.indexOf(task.status);
  const nextCol = currentIdx < columns.length - 1 ? columns[currentIdx + 1] : null;
  const xp = calcKanbanXP(task.importance, task.discomfort, task.urgency);

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3 group cursor-pointer hover:border-border-hover transition-colors" onClick={() => onEdit(task)}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium leading-tight">{task.title}</span>
        <GripVertical className="w-3.5 h-3.5 text-text-dim opacity-0 group-hover:opacity-100 flex-shrink-0" />
      </div>
      {task.block && (
        <span className="text-xs px-1.5 py-0.5 rounded inline-block mb-2" style={{ backgroundColor: BLOCK_COLORS[task.block] + "20", color: BLOCK_COLORS[task.block] }}>
          {BLOCK_ICONS[task.block]} {t.blocks[task.block]}
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-accent">{xp} XP</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {nextCol && (
            <button onClick={() => onMove(task.id, nextCol)} className="text-xs px-2 py-0.5 bg-bg-elevated rounded hover:bg-accent/20 text-text-dim hover:text-accent transition-colors">
              &rarr;
            </button>
          )}
          <button onClick={() => onDelete(task.id)} className="p-1 text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MatrixView({ tasks, t, onEdit }: { tasks: KanbanTask[]; t: Record<string, Record<string, string>>; onEdit: (t: KanbanTask) => void }) {
  const activeTasks = tasks.filter((t) => t.status !== "DONE");
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-red-400 mb-3">Urgent + Important</h3>
        <div className="space-y-2">
          {activeTasks.filter((t) => t.urgency >= 6 && t.importance >= 6).map((task) => (
            <div key={task.id} className="text-sm px-3 py-2 bg-bg-elevated rounded-lg cursor-pointer hover:bg-bg-card-hover" onClick={() => onEdit(task)}>{task.title}</div>
          ))}
        </div>
      </div>
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-400 mb-3">Important, Not Urgent</h3>
        <div className="space-y-2">
          {activeTasks.filter((t) => t.urgency < 6 && t.importance >= 6).map((task) => (
            <div key={task.id} className="text-sm px-3 py-2 bg-bg-elevated rounded-lg cursor-pointer hover:bg-bg-card-hover" onClick={() => onEdit(task)}>{task.title}</div>
          ))}
        </div>
      </div>
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-orange-400 mb-3">Urgent, Not Important</h3>
        <div className="space-y-2">
          {activeTasks.filter((t) => t.urgency >= 6 && t.importance < 6).map((task) => (
            <div key={task.id} className="text-sm px-3 py-2 bg-bg-elevated rounded-lg cursor-pointer hover:bg-bg-card-hover" onClick={() => onEdit(task)}>{task.title}</div>
          ))}
        </div>
      </div>
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-text-dim mb-3">Neither</h3>
        <div className="space-y-2">
          {activeTasks.filter((t) => t.urgency < 6 && t.importance < 6).map((task) => (
            <div key={task.id} className="text-sm px-3 py-2 bg-bg-elevated rounded-lg cursor-pointer hover:bg-bg-card-hover" onClick={() => onEdit(task)}>{task.title}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
