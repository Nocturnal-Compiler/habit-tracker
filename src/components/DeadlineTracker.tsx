"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Check, Flag, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import {
  createDeadline,
  deleteDeadline,
  toggleDeadline,
  type DeadlineItem,
} from "@/actions/productivityActions";

function getDeadlineStatus(dueDate: string, completed: boolean) {
  if (completed) return "Completed";

  const today = startOfDay(new Date());
  const due = startOfDay(parseISO(dueDate));
  const delta = differenceInCalendarDays(due, today);

  if (delta === 0) return "Due today";
  if (delta > 0) return `${delta} day${delta === 1 ? "" : "s"} left`;

  const overdueDays = Math.abs(delta);
  return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
}

export default function DeadlineTracker({ initialItems }: { initialItems: DeadlineItem[] }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<DeadlineItem[]>(initialItems);
  const [isMutating, setIsMutating] = useState(false);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [items]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || isMutating) return;

    setIsMutating(true);
    try {
      const created = await createDeadline(title, dueDate);
      setItems((prev) => [...prev, created]);
    } catch {
      // Keep UI stable on server failure.
    }
    setTitle("");
    setIsMutating(false);
  };

  const toggleCompleted = async (id: string) => {
    if (isMutating) return;

    const previous = items;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));

    setIsMutating(true);
    try {
      const updated = await toggleDeadline(id);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch {
      setItems(previous);
    }
    setIsMutating(false);
  };

  const removeItem = async (id: string) => {
    if (isMutating) return;

    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));

    setIsMutating(true);
    try {
      await deleteDeadline(id);
    } catch {
      setItems(previous);
    }
    setIsMutating(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-5 md:p-6 space-y-4"
    >
      <div className="flex items-center gap-2.5">
        <Flag className="w-4 h-4 text-zinc-300" />
        <h3 className="text-sm md:text-base font-semibold tracking-wide text-zinc-100">Deadline Tracker</h3>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add deadline..."
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
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
        {sortedItems.length === 0 ? (
          <p className="text-xs text-zinc-500">No deadlines yet.</p>
        ) : (
          sortedItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors",
                item.completed ? "border-white/10 bg-white/[0.02]" : "border-white/10 bg-black/30"
              )}
            >
              <button
                type="button"
                onClick={() => toggleCompleted(item.id)}
                className="flex items-center gap-2 min-w-0 text-left"
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center",
                    item.completed ? "border-white bg-white text-black" : "border-white/20"
                  )}
                >
                  {item.completed && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm truncate",
                      item.completed ? "text-zinc-400 line-through" : "text-zinc-200"
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    {format(parseISO(item.dueDate), "MMM d, yyyy")} • {getDeadlineStatus(item.dueDate, item.completed)}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Delete deadline"
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
