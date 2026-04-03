"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, ClipboardList, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createTodayTask,
  deleteTodayTask,
  toggleTodayTask,
  type TodayTaskItem,
} from "@/actions/productivityActions";

type TodayTasksProps = {
  initialTasks: TodayTaskItem[];
  variant?: "widget" | "page";
};

export default function TodayTasks({ initialTasks, variant = "widget" }: TodayTasksProps) {
  const isWidget = variant === "widget";
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState<TodayTaskItem[]>(initialTasks);
  const [isMutating, setIsMutating] = useState(false);

  const orderedTasks = useMemo(
    () => [...tasks].sort((a, b) => Number(a.done) - Number(b.done)),
    [tasks]
  );

  const completedCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const visibleTasks = isWidget ? orderedTasks.slice(0, 5) : orderedTasks;

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

  const clearCompleted = async () => {
    if (isMutating) return;
    const doneIds = tasks.filter((t) => t.done).map((t) => t.id);
    if (doneIds.length === 0) return;

    const previous = tasks;
    setTasks((prev) => prev.filter((t) => !t.done));

    setIsMutating(true);
    try {
      for (const id of doneIds) {
        await deleteTodayTask(id);
      }
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
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-5 md:p-6 space-y-4",
        isWidget ? "min-h-[23rem]" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-4 h-4 text-zinc-300" />
          <div>
            <h3 className="text-sm md:text-base font-semibold tracking-wide text-zinc-100">
              {isWidget ? "Today's Tasks" : "Things To Do For Today"}
            </h3>
            <p className="text-xs text-zinc-500">{completedCount}/{tasks.length} done</p>
          </div>
        </div>

        {isWidget ? (
          <Link
            href="/today-tasks"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors"
          >
            Open
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors"
            >
              Back To Daily Flow
            </Link>
            <button
              type="button"
              onClick={clearCompleted}
              disabled={isMutating}
              className="rounded-md border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              Clear Completed
            </button>
          </div>
        )}
      </div>

      {!isWidget && (
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
      )}

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <p className="text-xs text-zinc-500">No tasks yet.</p>
        ) : (
          visibleTasks.map((task) => (
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
                className={cn(
                  "text-zinc-500 hover:text-zinc-300 transition-colors",
                  isWidget ? "hidden" : ""
                )}
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}

        {isWidget && tasks.length > visibleTasks.length && (
          <p className="text-xs text-zinc-500">Open page to view all tasks.</p>
        )}
      </div>
    </motion.section>
  );
}
