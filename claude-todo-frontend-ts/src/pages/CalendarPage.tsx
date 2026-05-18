import { useState, useMemo } from "react";
import { useTodoStore } from "@/store/todo.store";
import CalendarGrid from "@/components/CalendarGrid";
import CalendarDayPanel from "@/components/CalendarDayPanel";
import { cn } from "@/utils";

export default function CalendarPage() {
  const todos = useTodoStore((s) => s.todos);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const todosByDate = useMemo(() => {
    const map = new Map<string, typeof todos>();
    for (const todo of todos) {
      if (todo.dueDate) {
        const key = todo.dueDate.slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(todo);
      }
    }
    return map;
  }, [todos]);

  const selectedTodos = selectedDay ? (todosByDate.get(selectedDay) ?? []) : [];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-xl text-slate-100">Calendar</h1>
        <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1 border border-surface-600">
          {(["month", "week"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "text-sm px-3 py-1 rounded-md capitalize transition-colors",
                viewMode === mode
                  ? "bg-surface-600 text-slate-200 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar + panel */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0">
          <CalendarGrid
            viewDate={viewDate}
            viewMode={viewMode}
            todosByDate={todosByDate}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onNavigate={setViewDate}
          />
        </div>

        {selectedDay && (
          <CalendarDayPanel
            date={selectedDay}
            todos={selectedTodos}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </div>
    </main>
  );
}
