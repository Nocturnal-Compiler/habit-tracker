"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { savePomodoroSettings, createPomodoroPreset, deletePomodoroPreset, logPomodoroSession, type PomodoroSettings } from "@/actions/productivityActions";
import { cn } from "@/lib/utils";

type SessionMode = "focus" | "break";

type PomodoroTimerProps = {
  initialSettings: PomodoroSettings;
  variant?: "widget" | "page";
  initialPresets?: Array<any>;
  initialSessions?: Array<any>;
};

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PomodoroTimer({ initialSettings, variant = "widget", initialPresets, initialSessions }: PomodoroTimerProps) {
  const isWidget = variant === "widget";
  const [focusMinutes, setFocusMinutes] = useState(initialSettings.focusMinutes ?? 25);
  const [breakMinutes, setBreakMinutes] = useState(initialSettings.breakMinutes ?? 5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(initialSettings.longBreakMinutes ?? 15);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(initialSettings.sessionsBeforeLongBreak ?? 4);
  const [autoStartNextSession, setAutoStartNextSession] = useState(initialSettings.autoStartNextSession ?? false);
  const [mode, setMode] = useState<SessionMode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((initialSettings.focusMinutes ?? 25) * 60);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [presets, setPresets] = useState<Array<any>>(initialSettings ? ([] as any) : []);
  const [sessions, setSessions] = useState<Array<any>>([]);

  const currentTotalSeconds = useMemo(() => {
    if (mode === "focus") return focusMinutes * 60;

    // If on a break, determine whether this should be a long break
    const useLong = sessionsBeforeLongBreak > 0 && sessionCount > 0 && sessionCount % sessionsBeforeLongBreak === 0;
    return (useLong ? longBreakMinutes : breakMinutes) * 60;
  }, [mode, focusMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak, sessionCount]);

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

    // Log the finished session to server (best-effort)
    (async () => {
      try {
        const logged = await logPomodoroSession(mode, currentTotalSeconds);
        setSessions((s) => [logged, ...s].slice(0, 50));
      } catch {
        // ignore logging failures
      }
    })();

    // Focus session finished
    if (mode === "focus") {
      const nextSessionCount = sessionCount + 1;
      setSessionCount(nextSessionCount);

      const useLong = sessionsBeforeLongBreak > 0 && nextSessionCount % sessionsBeforeLongBreak === 0;
      const nextBreakSeconds = (useLong ? longBreakMinutes : breakMinutes) * 60;

      setMode("break");
      if (autoStartNextSession) {
        setSecondsLeft(nextBreakSeconds);
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    } else {
      // Break finished
      setMode("focus");
      if (autoStartNextSession) {
        setSecondsLeft(focusMinutes * 60);
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  }, [secondsLeft, isRunning, mode, sessionCount, sessionsBeforeLongBreak, longBreakMinutes, breakMinutes, focusMinutes, autoStartNextSession, currentTotalSeconds]);

  const progress = currentTotalSeconds > 0 ? (secondsLeft / currentTotalSeconds) * 100 : 0;

  const applyPreset = async (focus: number, rest: number) => {
    if (isSavingPreset) return;

    setIsRunning(false);
    setFocusMinutes(focus);
    setBreakMinutes(rest);

    setIsSavingPreset(true);
    try {
      const saved = await savePomodoroSettings(focus, rest, longBreakMinutes, sessionsBeforeLongBreak, autoStartNextSession);
      setFocusMinutes(saved.focusMinutes);
      setBreakMinutes(saved.breakMinutes);
      setLongBreakMinutes(saved.longBreakMinutes);
      setSessionsBeforeLongBreak(saved.sessionsBeforeLongBreak);
      setAutoStartNextSession(saved.autoStartNextSession);
    } catch {
      // Keep local preset even if persistence fails.
    }
    setIsSavingPreset(false);
  };

  const saveSettings = async () => {
    setIsSavingPreset(true);
    try {
      const saved = await savePomodoroSettings(focusMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak, autoStartNextSession);
      setFocusMinutes(saved.focusMinutes);
      setBreakMinutes(saved.breakMinutes);
      setLongBreakMinutes(saved.longBreakMinutes);
      setSessionsBeforeLongBreak(saved.sessionsBeforeLongBreak);
      setAutoStartNextSession(saved.autoStartNextSession);
    } catch {
      // ignore failure
    }
    setIsSavingPreset(false);
  };

  // Preset management
  useEffect(() => {
    if (initialPresets && Array.isArray(initialPresets)) setPresets(initialPresets);
    if (initialSessions && Array.isArray(initialSessions)) setSessions(initialSessions);
  }, [initialPresets, initialSessions]);

  const savePreset = async () => {
    const name = window.prompt("Preset name:");
    if (!name) return;
    setIsSavingPreset(true);
    try {
      const created = await createPomodoroPreset(name, focusMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak);
      setPresets((p) => [created, ...p]);
    } catch {
      // ignore
    }
    setIsSavingPreset(false);
  };

  const removePreset = async (id: string) => {
    try {
      await deletePomodoroPreset(id);
      setPresets((p) => p.filter((x) => x.id !== id));
    } catch {
      // ignore
    }
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Timer className="w-4 h-4 text-zinc-300" />
          <h3 className="text-sm md:text-base font-semibold tracking-wide text-zinc-100">Pomodoro Timer</h3>
        </div>

        {isWidget ? (
          <Link
            href="/pomodoro"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors"
          >
            Open
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        ) : (
          <Link
            href="/"
            className="rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors"
          >
            Back To Daily Flow
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{mode === "focus" ? "Focus Session" : "Break Session"}</p>
        <p className={cn(
          "font-bold tracking-tight text-white tabular-nums",
          isWidget ? "text-4xl" : "text-5xl"
        )}>{formatClock(secondsLeft)}</p>

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

      {!isWidget && (
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-zinc-500">Advanced Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-sm text-zinc-400">Focus (min)
              <input type="number" min={1} max={180} value={focusMinutes} onChange={(e) => setFocusMinutes(Number(e.target.value))} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-sm" />
            </label>
            <label className="text-sm text-zinc-400">Short Break (min)
              <input type="number" min={1} max={60} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-sm" />
            </label>
            <label className="text-sm text-zinc-400">Long Break (min)
              <input type="number" min={1} max={180} value={longBreakMinutes} onChange={(e) => setLongBreakMinutes(Number(e.target.value))} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-sm" />
            </label>
            <label className="text-sm text-zinc-400">Sessions Before Long Break
              <input type="number" min={1} max={12} value={sessionsBeforeLongBreak} onChange={(e) => setSessionsBeforeLongBreak(Number(e.target.value))} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input type="checkbox" checked={autoStartNextSession} onChange={(e) => setAutoStartNextSession(Boolean(e.target.checked))} />
              Auto-start next session
            </label>
          </div>

          <div className="mt-2">
            <button onClick={saveSettings} disabled={isSavingPreset} className="rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 px-3 py-2 text-sm">Save Settings</button>
          </div>
        </div>
      )}

      {!isWidget && (
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-zinc-500">Presets</h4>
          <div className="flex gap-2 flex-wrap">
            {presets.length === 0 && <p className="text-xs text-zinc-500">No presets yet.</p>}
            {presets.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <button onClick={() => applyPreset(p.focusMinutes, p.breakMinutes)} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs">{p.name}</button>
                <button onClick={() => removePreset(p.id)} className="text-xs text-zinc-500">Delete</button>
              </div>
            ))}

            <button onClick={savePreset} disabled={isSavingPreset} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs">Save Preset</button>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-500">Recent Sessions</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto mt-2">
              {sessions.length === 0 && <p className="text-xs text-zinc-500">No sessions logged yet.</p>}
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs text-zinc-400">
                  <div>{s.mode === 'focus' ? 'Focus' : 'Break'} • {Math.round((s.durationSeconds || 0) / 60)}m</div>
                  <div className="text-[11px] text-zinc-500">{new Date(s.completedAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
