import { useMemo } from "react";
import type { Todo } from "@/types";
import { cn } from "@/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let i = first.getDay(); i > 0; i--) days.push(new Date(year, month, 1 - i));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  for (let d = 1, n = 6 - last.getDay(); d <= n; d++) days.push(new Date(year, month + 1, d));
  return days;
}

function buildWeekDays(ref: Date): Date[] {
  const start = new Date(ref);
  start.setDate(ref.getDate() - ref.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

interface Props {
  viewDate: Date;
  viewMode: "month" | "week";
  todosByDate: Map<string, Todo[]>;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  onNavigate: (date: Date) => void;
}

export default function CalendarGrid({
  viewDate, viewMode, todosByDate, selectedDay, onSelectDay, onNavigate,
}: Props) {
  const today = toDateStr(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(
    () => viewMode === "month" ? buildMonthGrid(year, month) : buildWeekDays(viewDate),
    [year, month, viewMode, viewDate]
  );

  const heading = useMemo(() => {
    if (viewMode === "month") return `${MONTHS[month]} ${year}`;
    const s = days[0];
    const e = days[6];
    const sMonth = MONTHS[s.getMonth()].slice(0, 3);
    const eMonth = MONTHS[e.getMonth()].slice(0, 3);
    return `${s.getDate()} ${sMonth} – ${e.getDate()} ${eMonth} ${e.getFullYear()}`;
  }, [viewMode, month, year, days]);

  const navigate = (dir: number) => {
    const d = new Date(viewDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    onNavigate(d);
  };

  return (
    <div className="card overflow-hidden">
      {/* Navigation header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg hover:bg-surface-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Previous"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-display font-semibold text-slate-200 text-sm sm:text-base">
          {heading}
        </span>
        <button
          onClick={() => navigate(1)}
          className="w-8 h-8 rounded-lg hover:bg-surface-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Next"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-surface-600 bg-surface-800/50">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-[10px] sm:text-xs text-slate-500 font-medium py-2">
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-y divide-surface-700">
        {days.map((d, i) => {
          const ds = toDateStr(d);
          const isToday = ds === today;
          const isSelected = ds === selectedDay;
          const inMonth = viewMode === "week" || d.getMonth() === month;
          const todos = todosByDate.get(ds) ?? [];
          const activeTodos = todos.filter((t) => t.status !== "done");

          return (
            <button
              key={i}
              onClick={() => onSelectDay(isSelected ? null : ds)}
              className={cn(
                "relative text-left p-1.5 sm:p-2 transition-colors",
                viewMode === "month"
                  ? "min-h-[56px] sm:min-h-[80px]"
                  : "min-h-[100px] sm:min-h-[140px]",
                (i + 1) % 7 !== 0 && "border-r border-surface-700",
                isSelected && "bg-indigo-600/20",
                !isSelected && inMonth && "hover:bg-surface-700/50",
                !isSelected && !inMonth && "hover:bg-surface-800/40",
                !inMonth && "opacity-40"
              )}
            >
              {/* Day number */}
              <span className={cn(
                "text-[10px] sm:text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full",
                isToday
                  ? "bg-accent text-surface-950 font-bold"
                  : isSelected
                  ? "text-indigo-300"
                  : "text-slate-400"
              )}>
                {d.getDate()}
              </span>

              {/* Month view: priority dots */}
              {viewMode === "month" && todos.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {activeTodos.slice(0, 3).map((t, j) => (
                    <span key={j} className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_DOT[t.priority])} />
                  ))}
                  {activeTodos.length === 0 && todos.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  )}
                  {todos.length > 3 && (
                    <span className="text-[9px] text-slate-500 leading-tight self-end">
                      +{todos.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Week view: todo title pills */}
              {viewMode === "week" && todos.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {todos.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate",
                        t.status === "done"
                          ? "text-slate-600 line-through"
                          : t.priority === "high"
                          ? "bg-red-900/40 text-red-300"
                          : t.priority === "medium"
                          ? "bg-amber-900/40 text-amber-300"
                          : "bg-emerald-900/40 text-emerald-300"
                      )}
                    >
                      {t.title}
                    </div>
                  ))}
                  {todos.length > 4 && (
                    <div className="text-[9px] text-slate-500 px-1">+{todos.length - 4} more</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
