// src/pages/AddTodoPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTodoStore } from "@/store/todo.store";
import TodoForm from "@/components/TodoForm";
import type { CreateTodoDto, UpdateTodoDto } from "@/types";

export default function AddTodoPage() {
  const navigate = useNavigate();
  const { createTodo } = useTodoStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTodoDto | UpdateTodoDto) => {
    setLoading(true);
    setError(null);
    try {
      await createTodo(data as CreateTodoDto);
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/"
          className="w-9 h-9 rounded-xl bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-slate-100">
            Task ใหม่
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่ม task เข้า list ของคุณ</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-700/30 rounded-xl text-red-400 text-sm animate-shake">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="card p-4 sm:p-6">
        <TodoForm
          onSubmit={handleSubmit}
          submitLabel="เพิ่ม Task"
          loading={loading}
        />
      </div>
    </main>
  );
}