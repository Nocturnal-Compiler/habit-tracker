"use client";

import { useState, type FormEvent } from "react";
import FluidBackground from "@/components/FluidBackground";
import HabitCard from "@/components/HabitCard";
// WeeklyView removed for overhaul
import MonthlyView from "@/components/MonthlyView";
import Sidebar from "@/components/Sidebar";
import AnimatedTitle from "@/components/AnimatedTitle";
import DeadlineTracker from "@/components/DeadlineTracker";
import TodayTasks from "@/components/TodayTasks";
import PomodoroTimer from "@/components/PomodoroTimer";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { createHabit, getHabits, deleteHabit } from "@/actions/habitActions";
import { Plus } from "lucide-react";
import type { DeadlineItem, PomodoroSettings, TodayTaskItem } from "@/actions/productivityActions";

type ViewMode = 'today' | 'monthly';

type DashboardViewProps = {
  initialHabits: any[];
  initialDeadlines: DeadlineItem[];
  initialTodayTasks: TodayTaskItem[];
  initialPomodoroSettings: PomodoroSettings;
};

export default function DashboardView({
  initialHabits,
  initialDeadlines,
  initialTodayTasks,
  initialPomodoroSettings,
}: DashboardViewProps) {
  const [view, setView] = useState<ViewMode>('today');
  const [habits, setHabits] = useState<any[]>(initialHabits);
  const [isCreating, setIsCreating] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("focus");
  const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newFrequency, setNewFrequency] = useState<number>(7);
  const [newStartDate, setNewStartDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [newTags, setNewTags] = useState<string>("");
  const [newReminderTime, setNewReminderTime] = useState<string | null>(null);
  const [newColor, setNewColor] = useState<string | null>(null);
  
  // Keeps streak visible before today's habit is checked.
  const getStreak = (logs: string[] = []) => {
    if (!Array.isArray(logs) || logs.length === 0) return 0;

    const uniqueLogs = new Set(logs);
    const today = new Date();
    const todayIso = format(today, 'yyyy-MM-dd');

    const d = new Date(today);
    if (!uniqueLogs.has(todayIso)) {
      d.setDate(d.getDate() - 1);
    }

    let streak = 0;
    while (true) {
      if (uniqueLogs.has(format(d, 'yyyy-MM-dd'))) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const handleCreateHabit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);

    await createHabit(newHabitTitle, newCategory, {
      priority: newPriority,
      frequencyPerWeek: newFrequency,
      startDate: newStartDate,
      tags,
      reminderTime: newReminderTime,
      color: newColor ?? undefined,
    });
    // Refresh habits list to reflect new habit
    try {
      const fresh = await getHabits();
      setHabits(fresh);
    } catch (e) {
      // ignore refresh errors for now
    }

    setNewHabitTitle("");
    setNewCategory("focus");
    setShowAdvancedCreate(false);
    setNewPriority("medium");
    setNewFrequency(7);
    setNewStartDate(format(new Date(), 'yyyy-MM-dd'));
    setNewTags("");
    setNewReminderTime(null);
    setNewColor(null);
    setIsCreating(false);
  };

  const handleDeleteHabit = async (id: string) => {
    // Optimistic remove from UI
    setHabits(prev => prev.filter(h => h._id !== id));
    try {
      await deleteHabit(id);
    } catch (err) {
      console.error("Failed to delete habit", err);
      try {
        const fresh = await getHabits();
        setHabits(fresh);
      } catch (e) {
        // ignore
      }
    }
  };

  // We check if today's date is in the logs for initial completed state
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex min-h-screen text-zinc-50 relative overflow-hidden">
      <FluidBackground />
      <Sidebar currentView={view} setView={setView} />

      <main className="flex-1 ml-0 md:ml-72 p-6 md:p-12 lg:p-24 relative z-10 overflow-y-auto min-h-screen">
        <div className="max-w-5xl mx-auto">
          <header className="mb-16 mt-10">
            <AnimatedTitle 
              text={view === 'today' ? "Daily Flow" : "Heatmap Matrix"} 
              className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 text-white"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <p className="text-zinc-400 text-lg font-medium">
                {view === 'today' ? "Execute your protocols and maintain momentum." : "Analyze your consistency patterns."}
              </p>
            </motion.div>
          </header>

          <AnimatePresence mode="wait">
            {view === 'today' && (
              <motion.div 
                key="today"
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {habits.map((habit) => (
                    <HabitCard 
                      key={habit._id} 
                      id={habit._id}
                      title={habit.title} 
                      streak={getStreak(habit.logs)} 
                      initialCompleted={habit.logs?.includes(todayIso)}
                      onDelete={handleDeleteHabit}
                    />
                  ))}
                </div>

                {isCreating ? (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleCreateHabit} 
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-xl mt-6"
                  >
                    <div className="flex gap-4">
                      <input 
                        autoFocus
                        type="text" 
                        value={newHabitTitle}
                        onChange={(e) => setNewHabitTitle(e.target.value)}
                        placeholder="Enter new protocol..." 
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-white/50 transition-all font-mono text-sm"
                      />
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm">
                        <option value="focus">Focus</option>
                        <option value="mind">Mind</option>
                        <option value="body">Body</option>
                      </select>
                      <button type="submit" className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-all border border-white/10 text-sm">Add</button>
                      <button type="button" onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-zinc-300 px-2 text-sm">Cancel</button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button type="button" onClick={() => setShowAdvancedCreate(s => !s)} className="text-xs text-zinc-400">{showAdvancedCreate ? 'Hide options' : 'More options'}</button>
                      <p className="text-xs text-zinc-500">You can set priority, weekly frequency, tags, reminder, and color.</p>
                    </div>

                    {showAdvancedCreate && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm">
                          <option value="low">Low priority</option>
                          <option value="medium">Medium priority</option>
                          <option value="high">High priority</option>
                        </select>

                        <input type="number" min={0} max={168} value={newFrequency} onChange={(e) => setNewFrequency(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Times per week" />

                        <input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />

                        <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="Tags (comma separated)" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />

                        <input type="time" value={newReminderTime ?? ''} onChange={(e) => setNewReminderTime(e.target.value || null)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />

                        <input type="text" value={newColor ?? ''} onChange={(e) => setNewColor(e.target.value || null)} placeholder="Color CSS (optional)" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                      </div>
                    )}
                  </motion.form>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setIsCreating(true); setShowAdvancedCreate(true); }}
                    className="w-full mt-6 p-4 rounded-xl border border-dashed border-white/10 bg-white/0 hover:bg-white/[0.03] backdrop-blur-sm flex items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300 transition-all group"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="font-medium tracking-wide text-sm">Initialize New Protocol</span>
                  </motion.button>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                  <DeadlineTracker initialItems={initialDeadlines} variant="widget" />
                  <TodayTasks initialTasks={initialTodayTasks} variant="widget" />
                  <PomodoroTimer initialSettings={initialPomodoroSettings} variant="widget" />
                </div>
              </motion.div>
            )}

            {/* Weekly heatmap removed for overhaul. */}

            {view === 'monthly' && (
              <MonthlyView key="monthly" habits={initialHabits} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}