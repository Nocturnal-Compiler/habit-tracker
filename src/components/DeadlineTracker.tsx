"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Flag, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import {
  createDeadline,
  deleteDeadline,
  toggleDeadline,
  type DeadlineItem,
} from "@/actions/productivityActions";

type DeadlineTrackerProps = {
  initialItems: DeadlineItem[];
  variant?: "widget" | "page";
};

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

export default function DeadlineTracker({ initialItems, variant = "widget" }: DeadlineTrackerProps) {
  const isWidget = variant === "widget";
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<DeadlineItem[]>(initialItems);
  const [isMutating, setIsMutating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<string | null>(null);
  const [reminderAt, setReminderAt] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems ?? []);
  }, [initialItems]);

  const { upcomingItems, overdueItems, completedItems } = useMemo(() => {
    const today = startOfDay(new Date());

    const upcoming = items
      .filter((item) => !item.completed)
      .filter((item) => differenceInCalendarDays(startOfDay(parseISO(item.dueDate)), today) >= 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const overdue = items
      .filter((item) => !item.completed)
      .filter((item) => differenceInCalendarDays(startOfDay(parseISO(item.dueDate)), today) < 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const completed = items
      .filter((item) => item.completed)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

    return {
      upcomingItems: upcoming,
      overdueItems: overdue,
      completedItems: completed,
    };
  }, [items]);

  const featuredUpcoming = isWidget ? upcomingItems.slice(0, 4) : upcomingItems;

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || isMutating) return;

    setIsMutating(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const created = await createDeadline(title, dueDate, priority, tags, reminderAt, categoryInput);
      setItems((prev) => [...prev, created]);
    } catch {
      // Keep UI stable on server failure.
    }
    setTitle("");
    setTagsInput("");
    setCategoryInput(null);
    setReminderAt(null);
    setPriority("medium");
    setShowAdvanced(false);
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

  const bulkCompleteOverdue = async () => {
    if (isMutating) return;
    const ids = overdueItems.filter((i) => !i.completed).map((i) => i.id);
    if (ids.length === 0) return;

    setIsMutating(true);
    try {
      for (const id of ids) {
        const updated = await toggleDeadline(id);
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      }
    } catch {
      // ignore errors
    }
    setIsMutating(false);
  };

  const exportCSV = () => {
    const header = "Title,Due Date,Completed\n";
    const rows = items.map((r) => `"${String(r.title).replace(/"/g, '""')}",${r.dueDate},${r.completed ? 'TRUE' : 'FALSE'}`);
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deadlines.csv";
    a.click();
    URL.revokeObjectURL(url);
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
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-5 md:p-6 space-y-4",
        isWidget ? "min-h-[23rem]" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Flag className="w-4 h-4 text-zinc-300" />
          <div>
            <h3 className="text-sm md:text-base font-semibold tracking-wide text-zinc-100">
              {isWidget ? "Upcoming Deadlines" : "Deadline Tracker"}
            </h3>
            <p className="text-xs text-zinc-500">
              {upcomingItems.length} upcoming{overdueItems.length > 0 ? ` • ${overdueItems.length} overdue` : ""}
            </p>
          </div>
        </div>

        {isWidget ? (
          <Link
            href="/deadlines"
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
              onClick={bulkCompleteOverdue}
              disabled={isMutating}
              className="rounded-md border border-amber-500/10 bg-amber-500/5 px-2.5 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              Mark Overdue Done
            </button>

            <button
              type="button"
              onClick={exportCSV}
              className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
            >
              Export
            </button>
          </div>
        )}
      </div>

      {!isWidget && (
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
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
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowAdvanced((s) => !s)} className="text-xs text-zinc-400 hover:text-zinc-200">{showAdvanced ? 'Hide options' : 'More options'}</button>
            <p className="text-xs text-zinc-500">Tip: use More options to add tags, category or reminder.</p>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <input type="text" value={categoryInput ?? ''} onChange={(e) => setCategoryInput(e.target.value)} placeholder="Category (optional)" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags (comma separated)" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="datetime-local" value={reminderAt ?? ''} onChange={(e) => setReminderAt(e.target.value || null)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          )}
        </form>
      )}

      <div className="space-y-4">
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {!isWidget && <p className="text-[11px] uppercase tracking-wider text-zinc-500">Upcoming</p>}
          {featuredUpcoming.length === 0 ? (
            <p className="text-xs text-zinc-500">No upcoming deadlines.</p>
          ) : (
            featuredUpcoming.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleCompleted(item.id)}
                  className="flex items-center gap-2 min-w-0 text-left"
                >
                  <span className="h-4 w-4 rounded border border-white/20 flex items-center justify-center">
                    {item.completed && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm truncate text-zinc-200">{item.title}</span>
                    <span className="block text-[11px] text-zinc-500">
                      {format(parseISO(item.dueDate), "MMM d, yyyy")} • {getDeadlineStatus(item.dueDate, item.completed)}
                    </span>
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span key={tag} className="text-[11px] text-zinc-300 bg-white/5 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </span>
                </button>

                {!isWidget && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    aria-label="Delete deadline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {!isWidget && overdueItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-amber-400/80">Overdue</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {overdueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => toggleCompleted(item.id)}
                    className="flex items-center gap-2 min-w-0 text-left"
                  >
                    <span className="h-4 w-4 rounded border border-white/20 flex items-center justify-center">
                      {item.completed && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm truncate text-zinc-200">{item.title}</span>
                        <span className="block text-[11px] text-zinc-500">
                          {format(parseISO(item.dueDate), "MMM d, yyyy")} • {getDeadlineStatus(item.dueDate, item.completed)}
                        </span>
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span key={tag} className="text-[11px] text-zinc-300 bg-white/5 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                      </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    aria-label="Delete overdue deadline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isWidget && completedItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Completed</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => toggleCompleted(item.id)}
                    className="flex items-center gap-2 min-w-0 text-left"
                  >
                    <span className="h-4 w-4 rounded border border-white bg-white text-black flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm truncate text-zinc-400 line-through">{item.title}</span>
                      <span className="block text-[11px] text-zinc-500">
                        {format(parseISO(item.dueDate), "MMM d, yyyy")} • {getDeadlineStatus(item.dueDate, item.completed)}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[11px] text-zinc-300 bg-white/5 px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    aria-label="Delete completed deadline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
