"use client";

import { useState, type FormEvent } from "react";
import FluidBackground from "@/components/FluidBackground";
import HabitCard from "@/components/HabitCard";
import WeeklyView from "@/components/WeeklyView";
import MonthlyView from "@/components/MonthlyView";
import Sidebar from "@/components/Sidebar";
import AnimatedTitle from "@/components/AnimatedTitle";
import DeadlineTracker from "@/components/DeadlineTracker";
import TodayTasks from "@/components/TodayTasks";
import PomodoroTimer from "@/components/PomodoroTimer";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { createHabit } from "@/actions/habitActions";
import { Plus } from "lucide-react";
import type { DeadlineItem, PomodoroSettings, TodayTaskItem } from "@/actions/productivityActions";

type ViewMode = 'today' | 'weekly' | 'monthly';

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
  const [isCreating, setIsCreating] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  
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
    await createHabit(newHabitTitle, "focus");
    setNewHabitTitle("");
    setIsCreating(false);
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
              text={view === 'today' ? "Daily Flow" : view === 'weekly' ? "Weekly Node" : "Heatmap Matrix"} 
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
                  {initialHabits.map((habit) => (
                    <HabitCard 
                      key={habit._id} 
                      id={habit._id}
                      title={habit.title} 
                      streak={getStreak(habit.logs)} 
                      initialCompleted={habit.logs?.includes(todayIso)}
                    />
                  ))}
                </div>

                {isCreating ? (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleCreateHabit} 
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-xl flex gap-4 mt-6"
                  >
                    <input 
                      autoFocus
                      type="text" 
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      placeholder="Enter new protocol..." 
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-white/50 transition-all font-mono text-sm"
                    />
                    <button type="submit" className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-all border border-white/10 text-sm">Add</button>
                    <button type="button" onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-zinc-300 px-2 text-sm">Cancel</button>
                  </motion.form>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsCreating(true)}
                    className="w-full mt-6 p-4 rounded-xl border border-dashed border-white/10 bg-white/0 hover:bg-white/[0.03] backdrop-blur-sm flex items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300 transition-all group"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="font-medium tracking-wide text-sm">Initialize New Protocol</span>
                  </motion.button>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                  <DeadlineTracker initialItems={initialDeadlines} />
                  <TodayTasks initialTasks={initialTodayTasks} />
                  <PomodoroTimer initialSettings={initialPomodoroSettings} />
                </div>
              </motion.div>
            )}

            {view === 'weekly' && (
              <WeeklyView key="weekly" habits={initialHabits} />
            )}

            {view === 'monthly' && (
              <MonthlyView key="monthly" habits={initialHabits} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}