// src/pages/HomePage.tsx
import { useEffect, useMemo, useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { focusApi } from "@/api/focus.api";
import { statsApi } from "@/api/stats.api";
import type { FocusStats } from "@/types";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useTodoStore } from "@/store/todo.store";
import TodoCard from "@/components/TodoCard";
import SortableTodoCard from "@/components/SortableTodoCard";
import FilterBar from "@/components/FilterBar";
import type { Status, Priority } from "@/types";

interface FilterState {
  status?: Status;
  priority?: Priority;
  search: string;
  sortBy: "order" | "createdAt" | "dueDate" | "priority";
}

export default function HomePage() {
  const { todos, tags, loading, fetchTodos, reorderTodos } = useTodoStore();
  const [focusStats, setFocusStats] = useState<FocusStats | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    focusApi.getStats().then((r) => setFocusStats(r.data)).catch(() => {});
    statsApi.getStats().then((r) => setStreak(r.data.streak)).catch(() => {});
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<FilterState>(() => ({
    status: (searchParams.get("status") as Status) || undefined,
    priority: (searchParams.get("priority") as Priority) || undefined,
    search: searchParams.get("q") || "",
    sortBy: (searchParams.get("sort") as FilterState["sortBy"]) || "order",
  }), [searchParams]);

  const handleFilterChange = useCallback((next: FilterState) => {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.priority) params.set("priority", next.priority);
    if (next.search) params.set("q", next.search);
    if (next.sortBy && next.sortBy !== "order") params.set("sort", next.sortBy);
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const isDragEnabled =
    filters.sortBy === "order" &&
    !filters.status &&
    !filters.priority &&
    !filters.search;

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
        t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()
    ).length;
    return { total, done, inProgress, overdue };
  }, [todos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const from = todos.findIndex((t) => t.id === active.id);
      const to = todos.findIndex((t) => t.id === over.id);
      reorderTodos(arrayMove(todos, from, to));
    },
    [todos, reorderTodos]
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="ทั้งหมด" value={stats.total} color="text-slate-300" />
        <StatCard label="กำลังทำ" value={stats.inProgress} color="text-amber-400" />
        <StatCard label="เสร็จแล้ว" value={stats.done} color="text-emerald-400" />
        <StatCard label="เลยกำหนด" value={stats.overdue} color="text-red-400" />
        <StatCard
          label="Focus วันนี้"
          value={focusStats?.todayMinutes ?? 0}
          color="text-violet-400"
          unit="m"
        />
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-2 mb-6 text-xs">
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.83-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.08-.46.02-.64-.14a1.19 1.19 0 0 1-.32-.46c-.09-.3-.14-.6-.14-.92C8.7 10.4 8.2 8.8 7 7.4c.89 1.2 1.4 2.6 1.4 3.99-.01.3-.01.61-.04.91C8.16 14.26 9 15.96 9 18c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.15-.83-4.19-2.34-5.8z"/>
          </svg>
          <span className="text-amber-400 font-mono font-semibold">{streak}</span>
          <span className="text-slate-500">day streak</span>
          <Link to="/stats" className="ml-auto text-slate-600 hover:text-slate-400 transition-colors">View stats →</Link>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={handleFilterChange} />

      {/* Drag hint */}
      {isDragEnabled && todos.length > 1 && (
        <p className="text-xs text-slate-600 text-center mb-3">
          Hold and drag to reorder
        </p>
      )}

      {/* Todo List */}
      {loading && todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <div className="w-10 h-10 border-2 border-surface-600 border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-sm font-body">กำลังโหลด...</p>
        </div>
      ) : todos.length === 0 ? (
        <EmptyState
          hasFilter={!!filters.status || !!filters.priority || !!filters.search}
        />
      ) : isDragEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {todos.map((todo) => (
                <SortableTodoCard key={todo.id} todo={todo} tags={tags} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

function StatCard({ label, value, color, unit }: { label: string; value: number; color: string; unit?: string }) {
  return (
    <div className="card px-4 py-3">
      <p className={`font-display font-bold text-2xl ${color}`}>
        {value}{unit && <span className="text-base ml-0.5">{unit}</span>}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center mb-4">
        {hasFilter ? (
          <svg aria-hidden="true" className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ) : (
          <svg aria-hidden="true" className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
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
