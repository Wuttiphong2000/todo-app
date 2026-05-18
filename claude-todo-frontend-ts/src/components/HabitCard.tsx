import { cn } from "@/utils";
import type { Habit } from "@/types";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

interface HabitCardProps {
  habit: Habit;
  onToggleToday: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HabitCard({ habit, onToggleToday, onEdit, onDelete }: HabitCardProps) {
  const todayDayIndex = new Date().getDay();
  // last7Days[i]: 0 = 6 days ago, 6 = today
  const last7Labels = Array.from({ length: 7 }, (_, i) =>
    DAY_LETTERS[(todayDayIndex - 6 + i + 7) % 7]
  );

  return (
    <div className="card px-4 py-3 flex items-center gap-4 group">
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: habit.color }}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium text-slate-200 truncate">{habit.title}</span>
          {habit.streak > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-400 flex-shrink-0">
              <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.83-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.08-.46.02-.64-.14a1.19 1.19 0 0 1-.32-.46c-.09-.3-.14-.6-.14-.92C8.7 10.4 8.2 8.8 7 7.4c.89 1.2 1.4 2.6 1.4 3.99-.01.3-.01.61-.04.91C8.16 14.26 9 15.96 9 18c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.15-.83-4.19-2.34-5.8z"/>
              </svg>
              <span className="font-mono font-semibold">{habit.streak}</span>
            </span>
          )}
        </div>

        {/* 7-day mini calendar */}
        <div className="flex gap-1">
          {habit.last7Days.map((done, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-slate-600">{last7Labels[i]}</span>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border transition-colors",
                  done ? "border-transparent" : "border-surface-500"
                )}
                style={done ? { backgroundColor: habit.color, opacity: 0.85 } : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Check-in toggle */}
        <button
          onClick={onToggleToday}
          className={cn(
            "w-8 h-8 rounded-lg border transition-all duration-150 flex items-center justify-center",
            habit.completedToday
              ? "border-transparent text-white"
              : "border-surface-500 text-slate-500 hover:border-slate-400 hover:text-slate-300"
          )}
          style={habit.completedToday ? { backgroundColor: habit.color } : undefined}
          aria-label={habit.completedToday ? "Undo today's check-in" : "Check in today"}
          title={habit.completedToday ? "Undo check-in" : "Check in"}
        >
          <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Edit */}
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-surface-700 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          aria-label="Edit habit"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          aria-label="Delete habit"
        >
          <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
