"use client";
import { format, subDays, startOfToday } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MonthlyViewProps {
  habits: any[];
}

export default function MonthlyView({ habits }: MonthlyViewProps) {
  const today = startOfToday();
  const past30Days = Array.from({ length: 30 }).map((_, i) => subDays(today, 29 - i));

  if (!habits || habits.length === 0) return <p className="text-zinc-500">No data found</p>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-black/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-3xl shadow-2xl"
    >
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Monthly Heatmap</h2>
        <p className="text-zinc-400">Consistency over the last 30 days</p>
      </div>

      <div className="space-y-12">
        {habits.map((habit, i) => (
          <div key={habit._id} className="w-full">
            <h3 className="text-sm font-medium text-white/70 mb-4">{habit.title}</h3>
            <div className="flex flex-wrap gap-2">
              {past30Days.map((date, index) => {
                const dateIso = format(date, 'yyyy-MM-dd');
                const isCompleted = habit.logs?.includes(dateIso);
                
                // Aesthetic intensity mapping (we could dynamically base this on the streak or category)
                const intensity = isCompleted ? ((i + index) % 5) / 5 : 0;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (i * 0.1) + (index * 0.01), duration: 0.3 }}
                    className={cn(
                      "w-4 h-4 rounded-sm sm:w-5 sm:h-5 sm:rounded-md transition-all duration-300",
                      isCompleted 
                        ? intensity > 0.6 
                          ? "bg-zinc-200 shadow-[0_0_10px_rgba(255,255,255,0.4)]" 
                          : "bg-zinc-500/60"
                        : "bg-white/5"
                    )}
                    whileHover={{ scale: 1.5, zIndex: 10 }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}