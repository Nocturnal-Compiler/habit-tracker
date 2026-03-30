"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { savePomodoroSettings, type PomodoroSettings } from "@/actions/productivityActions";

type SessionMode = "focus" | "break";

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PomodoroTimer({ initialSettings }: { initialSettings: PomodoroSettings }) {
  const [focusMinutes, setFocusMinutes] = useState(initialSettings.focusMinutes);
  const [breakMinutes, setBreakMinutes] = useState(initialSettings.breakMinutes);
  const [mode, setMode] = useState<SessionMode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(initialSettings.focusMinutes * 60);
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const currentTotalSeconds = useMemo(() => {
    return (mode === "focus" ? focusMinutes : breakMinutes) * 60;
  }, [mode, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (isRunning) return;
    setSecondsLeft(currentTotalSeconds);
  }, [currentTotalSeconds, isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || secondsLeft !== 0) return;

    setIsRunning(false);
    setMode((prev) => (prev === "focus" ? "break" : "focus"));
  }, [secondsLeft, isRunning]);

  const progress = currentTotalSeconds > 0 ? (secondsLeft / currentTotalSeconds) * 100 : 0;

  const applyPreset = async (focus: number, rest: number) => {
    if (isSavingPreset) return;

    setIsRunning(false);
    setFocusMinutes(focus);
    setBreakMinutes(rest);

    setIsSavingPreset(true);
    try {
      const saved = await savePomodoroSettings(focus, rest);
      setFocusMinutes(saved.focusMinutes);
      setBreakMinutes(saved.breakMinutes);
    } catch {
      // Keep local preset even if persistence fails.
    }
    setIsSavingPreset(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(currentTotalSeconds);
  };

  const skipSession = () => {
    setIsRunning(false);
    setMode((prev) => (prev === "focus" ? "break" : "focus"));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.06 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-5 md:p-6 space-y-4"
    >
      <div className="flex items-center gap-2.5">
        <Timer className="w-4 h-4 text-zinc-300" />
        <h3 className="text-sm md:text-base font-semibold tracking-wide text-zinc-100">Pomodoro Timer</h3>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{mode === "focus" ? "Focus Session" : "Break Session"}</p>
        <p className="text-4xl font-bold tracking-tight text-white tabular-nums">{formatClock(secondsLeft)}</p>

        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-zinc-200/80 transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => applyPreset(25, 5)}
          disabled={isSavingPreset}
          className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 py-2 transition-colors"
        >
          25 / 5
        </button>
        <button
          type="button"
          onClick={() => applyPreset(50, 10)}
          disabled={isSavingPreset}
          className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 py-2 transition-colors"
        >
          50 / 10
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setIsRunning((prev) => !prev)}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 py-2 text-sm font-medium transition-colors"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? "Pause" : "Start"}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 py-2 text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          type="button"
          onClick={skipSession}
          className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 py-2 text-sm transition-colors"
        >
          Skip
        </button>
      </div>
    </motion.section>
  );
}
