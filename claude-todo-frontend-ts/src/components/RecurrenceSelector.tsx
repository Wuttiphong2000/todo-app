import { cn } from "@/utils";
import type { Recurrence, RecurrenceType } from "@/types";

interface Props {
  value: Recurrence | null;
  onChange: (r: Recurrence | null) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_OPTIONS: { value: RecurrenceType | "none"; label: string }[] = [
  { value: "none",    label: "ไม่ซ้ำ" },
  { value: "daily",   label: "ทุกวัน" },
  { value: "weekly",  label: "ทุกสัปดาห์" },
  { value: "monthly", label: "ทุกเดือน" },
  { value: "custom",  label: "กำหนดเอง" },
];

export default function RecurrenceSelector({ value, onChange }: Props) {
  const selectedType = value?.type ?? "none";

  const handleTypeChange = (type: RecurrenceType | "none") => {
    if (type === "none") { onChange(null); return; }
    if (type === "daily" || type === "monthly") { onChange({ type }); return; }
    if (type === "weekly") { onChange({ type, days: [1] }); return; }
    if (type === "custom") { onChange({ type, interval: 7 }); return; }
  };

  const toggleDay = (day: number) => {
    if (!value || value.type !== "weekly") return;
    const days = value.days ?? [];
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b);
    if (next.length === 0) return; // keep at least 1
    onChange({ ...value, days: next });
  };

  const setInterval = (n: number) => {
    if (!value || value.type !== "custom") return;
    onChange({ ...value, interval: Math.max(1, Math.min(365, n)) });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleTypeChange(opt.value as RecurrenceType | "none")}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150",
              selectedType === opt.value
                ? "bg-violet-500/20 border-violet-500/60 text-violet-300"
                : "border-surface-500 text-slate-500 hover:border-surface-400 hover:text-slate-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Weekly: day-of-week toggles */}
      {value?.type === "weekly" && (
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map((label, i) => {
            const active = value.days?.includes(i) ?? false;
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={active}
                className={cn(
                  "w-9 h-9 rounded-lg text-xs font-mono border transition-colors duration-150",
                  active
                    ? "bg-violet-500/20 border-violet-500/60 text-violet-300"
                    : "border-surface-500 text-slate-500 hover:border-surface-400"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom: interval input */}
      {value?.type === "custom" && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>ทุก</span>
          <input
            type="number"
            min={1}
            max={365}
            value={value.interval ?? 7}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="input-base w-20 text-center text-sm py-1.5"
          />
          <span>วัน</span>
        </div>
      )}
    </div>
  );
}
