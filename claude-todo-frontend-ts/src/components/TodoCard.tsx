// src/components/TodoCard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTodoStore } from "@/store/todo.store";
import ConfirmDialog from "./ConfirmDialog";
import type { Todo } from "@/types";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  PRIORITY_CLASS,
  STATUS_CLASS,
  formatDate,
  isOverdue,
  cn,
} from "@/utils";

interface Props {
  todo: Todo;
  tags: { id: string; name: string; color: string }[];
  dragHandle?: React.ReactNode;
}

export default function TodoCard({ todo, tags, dragHandle }: Props) {
  const navigate = useNavigate();
  const { patchStatus, deleteTodo } = useTodoStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const overdue = isOverdue(todo.dueDate, todo.status);
  const todoTags = tags.filter((t) => todo.tagIds.includes(t.id));
  const doneCount = todo.subtasks.filter((s) => s.completed).length;

  const handleToggleDone = async () => {
    const next = todo.status === "done" ? "pending" : "done";
    await patchStatus(todo.id, next);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTodo(todo.id);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "card p-4 group transition-all duration-200 hover:border-surface-500 hover:-translate-y-0.5 hover:shadow-card",
          todo.status === "done" && "opacity-60"
        )}
      >
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          {dragHandle}

          {/* Checkbox */}
          <button
            onClick={handleToggleDone}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150",
              todo.status === "done"
                ? "bg-accent border-accent text-surface-950"
                : "border-surface-500 hover:border-accent"
            )}
            aria-label="Toggle done"
          >
            {todo.status === "done" && (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-display font-semibold text-sm text-slate-100 leading-snug truncate",
                todo.status === "done" && "line-through text-slate-500"
              )}
            >
              {todo.title}
            </h3>
            {todo.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                {todo.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => navigate(`/edit/${todo.id}`)}
              className="w-7 h-7 rounded-lg bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
              aria-label="Edit"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-7 h-7 rounded-lg bg-surface-700 hover:bg-red-900/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
              aria-label="Delete"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pl-8">
          {/* Priority */}
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-mono",
              PRIORITY_CLASS[todo.priority]
            )}
          >
            {PRIORITY_LABEL[todo.priority]}
          </span>

          {/* Status */}
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-mono",
              STATUS_CLASS[todo.status]
            )}
          >
            {STATUS_LABEL[todo.status]}
          </span>

          {/* Tags */}
          {todoTags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full border font-body"
              style={{
                backgroundColor: tag.color + "22",
                borderColor: tag.color + "44",
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}

          {/* Due date */}
          {todo.dueDate && (
            <span
              className={cn(
                "ml-auto text-xs font-mono",
                overdue ? "text-red-400" : "text-slate-500"
              )}
            >
              {overdue ? "⚠ " : ""}
              {formatDate(todo.dueDate)}
            </span>
          )}

          {/* Subtasks */}
          {todo.subtasks.length > 0 && (
            <span className="text-xs text-slate-600 font-mono ml-auto">
              {doneCount}/{todo.subtasks.length} subtasks
            </span>
          )}
        </div>
      </div>

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