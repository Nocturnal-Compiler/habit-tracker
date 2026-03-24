"use client";
import { format, startOfToday, startOfWeek, addDays } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WeeklyViewProps {
  habits: any[];
}

export default function WeeklyView({ habits }: WeeklyViewProps) {
  const today = startOfToday();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }); // 0 = Sunday
  const currentWeekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  if (!habits || habits.length === 0) return <p className="text-zinc-500">No data found</p>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-2xl shadow-2xl"
    >
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Weekly Flow</h2>
          <p className="text-zinc-400">Your momentum for the current week</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Days Header */}
        <div className="flex">
          <div className="w-1/3 md:w-1/4"></div>
          <div className="w-2/3 md:w-3/4 flex justify-between px-2">
            {currentWeekDays.map((targetDate) => (
              <span key={targetDate.toISOString()} className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                format(targetDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? "text-white" : "text-zinc-500"
              )}>
                {format(targetDate, "EEE")}
              </span>
            ))}
          </div>
        </div>

        {habits.map((habit, i) => (
          <motion.div 
            key={habit._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex items-center group"
          >
            <div className="w-1/3 md:w-1/4 pr-4">
              <span className="text-sm font-medium text-white/90 truncate block">{habit.title}</span>
            </div>
            
            <div className="w-2/3 md:w-3/4 flex justify-between relative px-2">
              {/* Connection Line Behind */}
              <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-white/5 -translate-y-1/2 z-0 rounded-full"></div>
              
              {currentWeekDays.map((targetDate) => {
                const dateIso = format(targetDate, 'yyyy-MM-dd');
                const isToday = dateIso === format(today, 'yyyy-MM-dd');
                const isCompleted = habit.logs?.includes(dateIso);
                
                return (
                  <div key={dateIso} className="relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.3 }}
                      className={cn(
                        "w-5 h-5 rounded-md border-[2px] transition-all duration-300",
                        isCompleted 
                          ? "bg-zinc-200 border-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110" 
                          : isToday ? "bg-white/10 border-white/30" : "bg-zinc-900 border-white/10"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}