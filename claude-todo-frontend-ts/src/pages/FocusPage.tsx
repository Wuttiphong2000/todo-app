import { useState, useEffect, useCallback } from "react";
import { useTodoStore } from "@/store/todo.store";
import { focusApi } from "@/api/focus.api";
import { usePomodoro } from "@/hooks/usePomodoro";
import { cn } from "@/utils";
import type { FocusSession, FocusStats } from "@/types";

const CIRCUMFERENCE = 2 * Math.PI * 100; // r=100

const PRESETS = [
  { label: "5 min",  seconds: 5 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "25 min", seconds: 25 * 60 },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function FocusPage() {
  const { todos } = useTodoStore();
  const { status, remaining, totalSeconds, start, pause, resume, stop, reset } = usePomodoro();

  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [activePreset, setActivePreset] = useState<number>(25 * 60);
  const [useCustom, setUseCustom] = useState(false);

  const [stats, setStats] = useState<FocusStats | null>(null);
  const [history, setHistory] = useState<FocusSession[]>([]);

  const loadData = useCallback(() => {
    focusApi.getStats().then((r) => setStats(r.data)).catch(() => {});
    focusApi.getHistory().then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh data after session ends
  useEffect(() => {
    if (status === "done") loadData();
  }, [status, loadData]);

  // Update document title while running
  useEffect(() => {
    if (status === "running" || status === "paused") {
      document.title = `${status === "paused" ? "⏸ " : "🍅 "}${formatTime(remaining)} — doable`;
    } else {
      document.title = "doable";
    }
    return () => { document.title = "doable"; };
  }, [status, remaining]);

  const selectedSeconds = useCustom ? customMinutes * 60 : activePreset;

  const handleStart = async () => {
    await start(selectedTodoId, selectedSeconds);
  };

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  const ringColor =
    status === "idle" ? "var(--ring-idle)" :
    remaining === 0   ? "#34d399" :
    "#F59E0B";

  const activeTodo = todos.find((t) => t.id === selectedTodoId);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-xl text-slate-100">Focus Mode</h1>
        {stats && (stats.todayMinutes > 0 || stats.todaySessions > 0) && (
          <div className="text-xs text-slate-500 text-right">
            <span className="text-violet-400 font-mono font-semibold">{stats.todayMinutes}m</span>
            <span> focused today · </span>
            <span className="text-slate-400">{stats.todaySessions} sessions</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* ── Timer card ── */}
        <div className="card p-6 flex flex-col items-center gap-5">
          {/* Duration selector */}
          {status === "idle" && (
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => { setActivePreset(p.seconds); setUseCustom(false); }}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150",
                    !useCustom && activePreset === p.seconds
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                      : "border-surface-500 text-slate-500 hover:border-surface-400 hover:text-slate-300"
                  )}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150",
                  useCustom
                    ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                    : "border-surface-500 text-slate-500 hover:border-surface-400 hover:text-slate-300"
                )}
              >
                Custom
              </button>
              {useCustom && (
                <div className="flex items-center gap-2 w-full justify-center mt-1">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
                    className="input-base w-20 text-center text-sm py-1.5"
                  />
                  <span className="text-sm text-slate-400">minutes</span>
                </div>
              )}
            </div>
          )}

          {/* Circular ring */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg
              viewBox="0 0 240 240"
              className="absolute inset-0 w-full h-full -rotate-90"
            >
              {/* Track */}
              <circle
                cx="120" cy="120" r="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface-600"
              />
              {/* Progress */}
              <circle
                cx="120" cy="120" r="100"
                fill="none"
                stroke={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                style={{ transition: status === "running" ? "stroke-dashoffset 1s linear" : "none" }}
              />
            </svg>

            {/* Time display */}
            <div className="relative flex flex-col items-center">
              <span className="font-display font-bold text-4xl tabular-nums text-slate-100">
                {formatTime(remaining)}
              </span>
              {status !== "idle" && (
                <span className={cn(
                  "text-xs font-mono mt-1",
                  status === "running" ? "text-amber-400" :
                  status === "paused"  ? "text-slate-500" :
                  remaining === 0      ? "text-emerald-400" : "text-slate-500"
                )}>
                  {status === "running" ? "focusing…" :
                   status === "paused"  ? "paused" :
                   remaining === 0      ? "complete!" : "stopped"}
                </span>
              )}
            </div>
          </div>

          {/* Task picker */}
          {status === "idle" && (
            <div className="w-full max-w-xs">
              <label htmlFor="focus-task" className="label-base text-center block mb-1">Task (optional)</label>
              <select
                id="focus-task"
                value={selectedTodoId ?? ""}
                onChange={(e) => setSelectedTodoId(e.target.value || null)}
                className="input-base text-sm w-full"
              >
                <option value="">— No specific task —</option>
                {todos.filter((t) => t.status !== "done").map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          {(status === "running" || status === "paused") && activeTodo && (
            <p className="text-xs text-slate-500 text-center px-4">
              Working on: <span className="text-slate-300">{activeTodo.title}</span>
            </p>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {status === "idle" && (
              <button onClick={handleStart} className="btn-primary px-8 py-2.5">
                Start
              </button>
            )}
            {status === "running" && (
              <>
                <button onClick={pause} className="btn-ghost border border-surface-500 px-6 py-2.5 text-sm">
                  Pause
                </button>
                <button onClick={stop} className="btn-ghost border border-red-800/60 text-red-400 hover:bg-red-900/20 px-6 py-2.5 text-sm">
                  Stop
                </button>
              </>
            )}
            {status === "paused" && (
              <>
                <button onClick={resume} className="btn-primary px-6 py-2.5">
                  Resume
                </button>
                <button onClick={stop} className="btn-ghost border border-red-800/60 text-red-400 hover:bg-red-900/20 px-6 py-2.5 text-sm">
                  Stop
                </button>
              </>
            )}
            {status === "done" && (
              <button onClick={reset} className="btn-primary px-8 py-2.5">
                New Session
              </button>
            )}
          </div>
        </div>

        {/* ── Session history ── */}
        <div className="flex flex-col gap-3">
          <h2 className="font-display font-semibold text-sm text-slate-400">Recent Sessions</h2>
          {history.length === 0 ? (
            <div className="card px-4 py-8 flex flex-col items-center text-center gap-2">
              <svg aria-hidden="true" className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="13" r="8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5v2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-xs text-slate-600">No sessions yet.<br/>Start your first focus session!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((s) => {
                const task = todos.find((t) => t.id === s.todoId);
                return (
                  <div key={s.id} className="card px-3 py-2.5 flex items-center gap-3">
                    <span className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      s.completed ? "bg-emerald-400" : "bg-slate-600"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">
                        {task?.title ?? "No task"}
                      </p>
                      <p className="text-xs text-slate-600 font-mono">
                        {formatDuration(s.duration)} · {new Date(s.startedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {s.completed ? (
                      <svg aria-hidden="true" className="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg aria-hidden="true" className="w-4 h-4 text-slate-600 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {stats && stats.weekMinutes > 0 && (
            <div className="card px-3 py-2.5 mt-1">
              <p className="text-xs text-slate-500">This week</p>
              <p className="font-display font-bold text-lg text-violet-400">{stats.weekMinutes}m</p>
              <p className="text-xs text-slate-600">total focus time</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
