// src/components/FilterBar.tsx
import { cn } from "@/utils";
import type { Status, Priority } from "@/types";

interface FilterState {
  status?: Status;
  priority?: Priority;
  search: string;
  sortBy: "order" | "createdAt" | "dueDate" | "priority";
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const STATUS_OPTIONS: { value: Status | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: Priority | ""; label: string }[] = [
  { value: "", label: "Priority ทั้งหมด" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Row 1: Search */}
      <div className="relative">
        <svg
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="input-base pl-9 text-sm"
          placeholder="ค้นหา task..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Row 2: Status + Priority + Sort */}
      <div className="flex flex-wrap gap-2">
        {/* Status filter */}
        <div className="flex gap-1 bg-surface-800 border border-surface-600 rounded-xl p-1 flex-shrink-0">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onChange({ ...filters, status: (opt.value || undefined) as Status | undefined })
              }
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-lg font-body transition-all duration-150 whitespace-nowrap",
                filters.status === (opt.value || undefined)
                  ? "bg-surface-600 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Priority + Sort */}
        <div className="flex gap-2 flex-1 min-w-0">
          <select
            className="input-base text-sm py-2 flex-1 min-w-0"
            value={filters.priority ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                priority: (e.target.value as Priority) || undefined,
              })
            }
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="input-base text-sm py-2 flex-1 min-w-0"
            value={filters.sortBy}
            onChange={(e) =>
              onChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })
            }
          >
            <option value="order">Manual</option>
            <option value="createdAt">Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>
    </div>
  );
}