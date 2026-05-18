import type { Todo, Status } from "@/types";
import { useTodoStore } from "@/store/todo.store";
import { Link } from "react-router-dom";
import { cn } from "@/utils";

const STATUS_NEXT: Record<Status, Status> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/20 text-red-300 border border-red-500/30",
  medium: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
};

function formatPanelDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface Props {
  date: string;
  todos: Todo[];
  onClose: () => void;
}

export default function CalendarDayPanel({ date, todos, onClose }: Props) {
  const { patchStatus } = useTodoStore();

  return (
    <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-surface-600">
          <div>
            <p className="text-xs text-slate-500 font-medium">{formatPanelDate(date)}</p>
            <p className="text-sm text-slate-300 mt-0.5">
              {todos.length === 0
                ? "No tasks"
                : `${todos.length} task${todos.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-surface-700 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-colors -mt-0.5 flex-shrink-0"
            aria-label="Close"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Todo list */}
        <div className="divide-y divide-surface-700 max-h-[400px] lg:max-h-[calc(100vh-320px)] overflow-y-auto">
          {todos.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">Nothing due on this day.</p>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-700/30 transition-colors"
              >
                {/* Status toggle */}
                <button
                  onClick={() => patchStatus(todo.id, STATUS_NEXT[todo.status])}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    todo.status === "done"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : todo.status === "in_progress"
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-slate-500 hover:border-slate-300"
                  )}
                  aria-label={`Mark as ${STATUS_NEXT[todo.status]}`}
                >
                  {todo.status === "done" && (
                    <svg aria-hidden="true" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {todo.status === "in_progress" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/edit/${todo.id}`}
                    className={cn(
                      "text-sm font-medium hover:text-indigo-300 transition-colors block truncate",
                      todo.status === "done" ? "line-through text-slate-500" : "text-slate-200"
                    )}
                  >
                    {todo.title}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium capitalize", PRIORITY_BADGE[todo.priority])}>
                      {todo.priority}
                    </span>
                    {todo.subtasks.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length} subtasks
                      </span>
                    )}
                    {todo.tagIds.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {todo.tagIds.length} tag{todo.tagIds.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
