"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Check, ClipboardList, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createTodayTask,
  deleteTodayTask,
  toggleTodayTask,
  type TodayTaskItem,
} from "@/actions/productivityActions";

export default function TodayTasks({ initialTasks }: { initialTasks: TodayTaskItem[] }) {
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState<TodayTaskItem[]>(initialTasks);
  const [isMutating, setIsMutating] = useState(false);

  const completedCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim() || isMutating) return;

    setIsMutating(true);
    try {
      const created = await createTodayTask(taskInput);
      setTasks((prev) => [...prev, created]);
    } catch {
      // Keep UI stable on server failure.
    }
    setTaskInput("");
    setIsMutating(false);
  };

  const toggleTask = async (id: string) => {
    if (isMutating) return;

    const previous = tasks;
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));

    setIsMutating(true);
    try {
      const updated = await toggleTodayTask(id);
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
    } catch {
      setTasks(previous);
    }
    setIsMutating(false);
  };

  const removeTask = async (id: string) => {
    if (isMutating) return;

    const previous = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));

    setIsMutating(true);
    try {
      await deleteTodayTask(id);
    } catch {
      setTasks(previous);
    }
    setIsMutating(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.03 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-5 md:p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-4 h-4 text-zinc-300" />
          <h3 className="text-sm md:text-base font-semibold tracking-wide text-zinc-100">Things To Do For Today</h3>
        </div>
        <span className="text-xs text-zinc-500">{completedCount}/{tasks.length} done</span>
      </div>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="Add a task for today..."
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={isMutating}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <p className="text-xs text-zinc-500">No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5",
                task.done ? "border-white/10 bg-white/[0.02]" : "border-white/10 bg-black/30"
              )}
            >
              <button type="button" onClick={() => toggleTask(task.id)} className="flex items-center gap-2 min-w-0 text-left">
                <span
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center",
                    task.done ? "border-white bg-white text-black" : "border-white/20"
                  )}
                >
                  {task.done && <Check className="h-3 w-3" />}
                </span>
                <span className={cn("text-sm truncate", task.done ? "text-zinc-400 line-through" : "text-zinc-200")}>
                  {task.text}
                </span>
              </button>

              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.section>
  );
}
