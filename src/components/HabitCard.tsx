"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toggleHabitLog } from "@/actions/habitActions";
import { format } from "date-fns";

interface HabitCardProps {
  id: string;
  title: string;
  streak: number;
  initialCompleted?: boolean;
}

export default function HabitCard({ id, title, streak, initialCompleted = false }: HabitCardProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    // Optimistic UI update
    setCompleted(!completed);
    
    try {
      const todayIso = format(new Date(), 'yyyy-MM-dd');
      await toggleHabitLog(id, todayIso);
    } catch (e) {
      // Revert if failed
      setCompleted(completed);
    }
    setIsUpdating(false);
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden p-4 rounded-xl border border-white/5 backdrop-blur-2xl bg-white/[0.03] shadow-xl transition-all duration-500 cursor-pointer group",
        completed ? "bg-white/10 border-white/20" : "hover:bg-white/5 hover:border-white/10"
      )}
      onClick={handleToggle}
    >
      {/* Aesthetic glowing orb inside the card */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-zinc-300/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 transition-opacity duration-700",
        completed ? "opacity-100" : "opacity-0 group-hover:opacity-40"
      )} />
      
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex flex-col gap-0.5">
          <h3 className={cn(
            "text-lg font-medium tracking-tight transition-colors duration-500",
            completed ? "text-white" : "text-white/80"
          )}>
            {title}
          </h3>
          <p className="text-xs text-zinc-400 font-medium tracking-wide flex items-center gap-1.5">
            <span className={cn("inline-block w-1.5 h-1.5 rounded-full", completed ? "bg-zinc-400" : "bg-zinc-600")}></span>
            {streak} day streak
          </p>
        </div>
        
        <div className={cn(
          "h-6 w-6 rounded border flex items-center justify-center transition-all duration-500 shadow-inner group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
          completed 
            ? "bg-white border-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
            : "border-white/20 text-transparent bg-black/40"
        )}>
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      </div>
    </motion.div>
  );
}