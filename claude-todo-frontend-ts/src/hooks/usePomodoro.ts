import { useState, useEffect, useRef, useCallback } from "react";
import { focusApi } from "@/api/focus.api";

export type PomodoroStatus = "idle" | "running" | "paused" | "done";

interface UsePomodoroReturn {
  status: PomodoroStatus;
  remaining: number;
  totalSeconds: number;
  start: (todoId: string | null, seconds: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  reset: () => void;
}

export function usePomodoro(): UsePomodoroReturn {
  const [status, setStatus] = useState<PomodoroStatus>("idle");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const sessionIdRef = useRef<string | null>(null);
  const endingRef = useRef(false);

  // Countdown tick
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Auto-complete when timer reaches 0
  useEffect(() => {
    if (status !== "running" || remaining > 0) return;
    if (endingRef.current) return;
    endingRef.current = true;
    setStatus("done");
    const sid = sessionIdRef.current;
    sessionIdRef.current = null;
    if (sid) focusApi.end(sid, true).catch(() => {});
  }, [remaining, status]);

  const start = useCallback(async (todoId: string | null, seconds: number) => {
    endingRef.current = false;
    setTotalSeconds(seconds);
    setRemaining(seconds);
    try {
      const res = await focusApi.start({ todoId, duration: seconds });
      sessionIdRef.current = res.data.id;
    } catch {
      sessionIdRef.current = null;
    }
    setStatus("running");
  }, []);

  const pause = useCallback(() => {
    setStatus((s) => (s === "running" ? "paused" : s));
  }, []);

  const resume = useCallback(() => {
    setStatus((s) => (s === "paused" ? "running" : s));
  }, []);

  const stop = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setStatus("done");
    const sid = sessionIdRef.current;
    sessionIdRef.current = null;
    if (sid) await focusApi.end(sid, false).catch(() => {});
  }, []);

  const reset = useCallback(() => {
    endingRef.current = false;
    sessionIdRef.current = null;
    setStatus("idle");
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  return { status, remaining, totalSeconds, start, pause, resume, stop, reset };
}
