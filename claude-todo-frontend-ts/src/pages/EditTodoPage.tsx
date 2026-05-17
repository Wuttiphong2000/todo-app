// src/pages/EditTodoPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTodoStore } from "@/store/todo.store";
import ConfirmDialog from "@/components/ConfirmDialog";
import TodoForm from "@/components/TodoForm";
import type { CreateTodoDto, UpdateTodoDto } from "@/types";

export default function EditTodoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { todos, updateTodo, deleteTodo } = useTodoStore();

  const todo = todos.find((t) => t.id === id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!todo && todos.length > 0) {
      navigate("/", { replace: true });
    }
  }, [todo, todos]);

  if (!todo) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          🔍
        </div>
        <p className="text-slate-500">ไม่พบ task นี้</p>
        <Link to="/" className="btn-primary mt-4 inline-block">
          กลับหน้าหลัก
        </Link>
      </main>
    );
  }

  const handleSubmit = async (data: CreateTodoDto | UpdateTodoDto) => {
    setLoading(true);
    setError(null);
    try {
      await updateTodo(todo.id, data as UpdateTodoDto);
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTodo(todo.id);
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
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
                แก้ไข Task
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                {todo.title}
              </p>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => setConfirmOpen(true)}
            className="btn-danger text-sm"
          >
            ลบ Task
          </button>
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
            initial={todo}
            onSubmit={handleSubmit}
            submitLabel="บันทึกการแก้ไข"
            loading={loading}
          />
        </div>
      </main>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="ลบ Task นี้?"
        message={`"${todo.title}" จะถูกลบถาวรและไม่สามารถกู้คืนได้`}
        confirmLabel={deleting ? "กำลังลบ..." : "ลบถาวร"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}