// src/pages/HomePage.tsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTodoStore } from "@/store/todo.store";
import TodoCard from "@/components/TodoCard";
import FilterBar from "@/components/FilterBar";
import type { Status, Priority } from "@/types";

interface FilterState {
  status?: Status;
  priority?: Priority;
  search: string;
  sortBy: "order" | "createdAt" | "dueDate" | "priority";
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  sortBy: "order",
};

export default function HomePage() {
  const { todos, tags, loading, fetchTodos } = useTodoStore();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    fetchTodos({
      status: filters.status,
      priority: filters.priority,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortDir: "asc",
    });
  }, [filters]);

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((t) => t.status === "done").length;
    const inProgress = todos.filter((t) => t.status === "in_progress").length;
    const overdue = todos.filter(
      (t) =>
        t.dueDate &&
        t.status !== "done" &&
        new Date(t.dueDate) < new Date()
    ).length;
    return { total, done, inProgress, overdue };
  }, [todos]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="ทั้งหมด" value={stats.total} color="text-slate-300" />
        <StatCard label="กำลังทำ" value={stats.inProgress} color="text-amber-400" />
        <StatCard label="เสร็จแล้ว" value={stats.done} color="text-emerald-400" />
        <StatCard label="เลยกำหนด" value={stats.overdue} color="text-red-400" />
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Todo List */}
      {loading && todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <div className="w-10 h-10 border-2 border-surface-600 border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-sm font-body">กำลังโหลด...</p>
        </div>
      ) : todos.length === 0 ? (
        <EmptyState hasFilter={!!filters.status || !!filters.priority || !!filters.search} />
      ) : (
        <div className="space-y-2">
          {todos.map((todo, i) => (
            <div
              key={todo.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
            >
              <TodoCard todo={todo} tags={tags} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card px-4 py-3">
      <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center mb-4 text-2xl">
        {hasFilter ? "🔍" : "✅"}
      </div>
      <h3 className="font-display font-semibold text-slate-300 mb-1">
        {hasFilter ? "ไม่พบ task ที่ค้นหา" : "ยังไม่มี task เลย!"}
      </h3>
      <p className="text-sm text-slate-600 mb-6">
        {hasFilter
          ? "ลองเปลี่ยน filter ดูนะ"
          : "เริ่มเพิ่ม task แรกของคุณได้เลย"}
      </p>
      {!hasFilter && (
        <Link to="/add" className="btn-primary">
          + เพิ่ม Task แรก
        </Link>
      )}
    </div>
  );
}