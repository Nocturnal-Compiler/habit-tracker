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
  const [sessionName, setSessionName] = useState("");
  const [presets, setPresets] = useState<Array<any>>(initialPresets && Array.isArray(initialPresets) ? initialPresets : []);
  const [sessions, setSessions] = useState<Array<any>>(initialSessions && Array.isArray(initialSessions) ? initialSessions : []);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);

  const currentTotalSeconds = useMemo(() => {
    if (mode === "focus") return focusMinutes * 60;

    // If on a break, determine whether this should be a long break
    const useLong = sessionsBeforeLongBreak > 0 && sessionCount > 0 && sessionCount % sessionsBeforeLongBreak === 0;
    return (useLong ? longBreakMinutes : breakMinutes) * 60;
  }, [mode, focusMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak, sessionCount]);

  // Track changes to currentTotalSeconds to appropriately update secondsLeft exclusively when not running, without resetting on pause.
  useEffect(() => {
    if (isRunning) return;
    setSecondsLeft(currentTotalSeconds);
    setTargetEndTime(null);
  }, [currentTotalSeconds]); // Intentionally omitting isRunning so pausing doesn't reset time

  useEffect(() => {
    if (!isRunning) return;

    if (!targetEndTime) {
      setTargetEndTime(Date.now() + secondsLeft * 1000);
    }

    const timer = setInterval(() => {
      if (!targetEndTime) return;
      const now = Date.now();
      const remaining = Math.round((targetEndTime - now) / 1000);
      setSecondsLeft(Math.max(remaining, 0));
    }, 500); // 500ms to keep it snappy and responsive even with minor drift

    return () => clearInterval(timer);
  }, [isRunning, targetEndTime]);

  // Document Title Effect
  useEffect(() => {
    if (!isRunning) {
      document.title = "Habit Tracker";
      return;
    }
    const modeLabel = mode === "focus" ? "Focus" : "Break";
    document.title = `(${formatClock(secondsLeft)}) ${modeLabel} | Habit Tracker`;
  }, [secondsLeft, isRunning, mode]);

  useEffect(() => {
    if (!isRunning || secondsLeft > 0) return;

    // Log the finished session to server (best-effort)
    (async () => {
      try {
        const logged = await logPomodoroSession(mode, currentTotalSeconds, mode === "focus" ? sessionName : undefined);
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
        setTargetEndTime(Date.now() + nextBreakSeconds * 1000);
        setIsRunning(true);
      } else {
        setIsRunning(false);
        setTargetEndTime(null);
      }
    } else {
      // Break finished
      setMode("focus");
      if (autoStartNextSession) {
        setSecondsLeft(focusMinutes * 60);
        setTargetEndTime(Date.now() + focusMinutes * 60 * 1000);
        setIsRunning(true);
      } else {
        setIsRunning(false);
        setTargetEndTime(null);
      }
    }
  }, [secondsLeft, isRunning]);

  const progress = currentTotalSeconds > 0 ? ((currentTotalSeconds - secondsLeft) / currentTotalSeconds) * 100 : 0;

  const toggleRunning = () => {
    if (!isRunning) {
      // Starting
      setTargetEndTime(Date.now() + secondsLeft * 1000);
      setIsRunning(true);
    } else {
      // Pausing
      setIsRunning(false);
      setTargetEndTime(null);
    }
  };

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
    setTargetEndTime(null);
    setSecondsLeft(currentTotalSeconds);
  };

  const skipSession = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    setMode((prev) => (prev === "focus" ? "break" : "focus"));
  };

  // Allow detaching window via proper HTML5 picture in picture via document (if Chrome allows, or simple open)
  const openDetachedWindow = () => {
    // Check if the current environment supports window.open efficiently (or simply inform the user to use "Tab tear-off").
    // The most reliable detachable window is window.open
    const features = "width=400,height=300,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes";
    window.open("/pomodoro", "_blank", features);
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
          <div className="flex items-center gap-2">
            <button
              onClick={openDetachedWindow}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors"
              title="Open detached timer window"
            >
              Detach
            </button>
            <Link
              href="/pomodoro"
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors"
            >
              Open
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={openDetachedWindow}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors"
              title="Open detached timer window"
            >
              Detach
            </button>
            <Link
              href="/"
              className="rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors"
            >
              Back To Daily Flow
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{mode === "focus" ? "Focus Session" : "Break Session"}</p>
        
        {!isWidget && mode === "focus" && (
          <div className="flex justify-center -mt-1 mb-2">
            <input 
              type="text" 
              placeholder="Name this session... (e.g. Reading, Coding)" 
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              disabled={isRunning}
              className="w-full max-w-[220px] bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-center outline-none focus:border-white/30 disabled:opacity-50 transition-colors"
            />
          </div>
        )}

        <p className={cn(
          "font-bold tracking-tight text-white tabular-nums",
          isWidget ? "text-4xl" : "text-5xl"
        )}>{formatClock(secondsLeft)}</p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={toggleRunning}
            className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/10 bg-white hover:bg-white/90 text-black transition-colors"
          >
            {isRunning ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-black" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-black ml-1" />}
          </button>
          
          <button
            title="Reset Session"
            onClick={resetTimer}
            className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={skipSession}
            title="Skip Session"
            className="flex items-center justify-center h-10 px-4 md:h-12 md:px-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider text-white transition-colors"
          >
            Skip
          </button>
        </div>

        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mt-4">
          <div
            className="h-full bg-zinc-200/80 transition-all duration-300"
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
            <div className="space-y-2 max-h-40 overflow-y-auto mt-2">
              {sessions.length === 0 && <p className="text-xs text-zinc-500">No sessions logged yet.</p>}
              {sessions.map((s) => (
                <div key={s.id} className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-xs transition-colors text-zinc-400">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-zinc-300">{s.mode === 'focus' ? 'Focus' : 'Break'} • {Math.round((s.durationSeconds || 0) / 60)}m</div>
                    <div className="text-[11px] text-zinc-500">{new Date(s.completedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  {s.name && <div className="text-[11px] text-zinc-500 italic max-w-[200px] truncate" title={s.name}>"{s.name}"</div>}
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
