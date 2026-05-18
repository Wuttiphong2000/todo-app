import { useState, useEffect } from "react";
import { cn } from "@/utils";
import type { Habit, CreateHabitDto, UpdateHabitDto } from "@/types";

const HABIT_COLORS = [
  "#6366f1", "#8b5cf6", "#f43f5e", "#f97316",
  "#eab308", "#10b981", "#06b6d4", "#ec4899",
];

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AddHabitModalProps {
  initial?: Habit;
  onSave: (dto: CreateHabitDto | UpdateHabitDto) => Promise<void>;
  onClose: () => void;
}

export default function AddHabitModal({ initial, onSave, onClose }: AddHabitModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [color, setColor] = useState(initial?.color ?? HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">(initial?.frequency ?? "daily");
  const [targetDays, setTargetDays] = useState<number[]>(initial?.targetDays ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const toggleDay = (day: number) =>
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        color,
        frequency,
        targetDays: frequency === "weekly" ? targetDays : [],
      });
      onClose();
    } catch {
      setError("Failed to save habit");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm shadow-xl">
        <h2 id="habit-modal-title" className="font-display font-bold text-slate-100 mb-5">
          {initial ? "Edit Habit" : "New Habit"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="habit-title" className="label-base">Title</label>
            <input
              id="habit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base w-full mt-1"
              placeholder="e.g. Morning run"
              autoFocus
              maxLength={100}
              autoComplete="off"
            />
          </div>

          {/* Color */}
          <div>
            <span className="label-base block mb-2">Color</span>
            <div className="flex gap-2 flex-wrap">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform duration-100",
                    color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <span className="label-base block mb-2">Frequency</span>
            <div className="flex gap-2">
              {(["daily", "weekly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    "flex-1 text-sm py-1.5 rounded-lg border transition-colors duration-150 capitalize",
                    frequency === f
                      ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300"
                      : "border-surface-500 text-slate-500 hover:border-surface-400 hover:text-slate-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Target days (weekly only) */}
          {frequency === "weekly" && (
            <div>
              <span className="label-base block mb-2">Target days</span>
              <div className="flex gap-1">
                {DAYS.map((letter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    title={DAY_LABELS[i]}
                    className={cn(
                      "flex-1 py-1.5 text-xs rounded-lg border transition-colors duration-150",
                      targetDays.includes(i)
                        ? "border-transparent text-white"
                        : "border-surface-500 text-slate-500 hover:border-surface-400 hover:text-slate-300"
                    )}
                    style={targetDays.includes(i) ? { backgroundColor: color } : undefined}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 py-2 disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
