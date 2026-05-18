// src/components/TodoCard.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
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

          {/* Checkbox — visual is 20px but touch target is 40px via negative margin */}
          <button
            onClick={handleToggleDone}
            className="mt-0.5 flex-shrink-0 -m-[10px] p-[10px] flex items-center justify-center"
            aria-label={todo.status === "done" ? "Mark as pending" : "Mark as done"}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center",
                "transition-colors duration-150",
                todo.status === "done"
                  ? "bg-accent border-accent text-surface-950"
                  : "border-surface-500 hover:border-accent"
              )}
            >
              {todo.status === "done" && (
                <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
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

          {/* Actions — always visible on touch, hover-reveal on desktop */}
          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Link
              to={`/edit/${todo.id}`}
              className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
              aria-label="Edit"
            >
              <svg aria-hidden="true" className="w-4 h-4 sm:w-3.5 sm:h-3.5" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg bg-surface-700 hover:bg-red-900/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
              aria-label="Delete"
            >
              <svg aria-hidden="true" className="w-4 h-4 sm:w-3.5 sm:h-3.5" viewBox="0 0 16 16" fill="none">
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

          {/* Recurrence badge */}
          {todo.recurrence && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-mono flex items-center gap-1">
              <svg aria-hidden="true" className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4h10a4 4 0 0 1 0 8H3M1 4l3-3M1 4l3 3" />
              </svg>
              {todo.recurrence.type === "custom"
                ? `every ${todo.recurrence.interval}d`
                : todo.recurrence.type}
            </span>
          )}

          {/* Due date */}
          {todo.dueDate && (
            <span
              className={cn(
                "ml-auto text-xs font-mono",
                overdue ? "text-red-400" : "text-slate-500"
              )}
            >
              {overdue && (
                <svg aria-hidden="true" className="inline w-3 h-3 mr-0.5 -mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a.5.5 0 0 1 .44.26l6.5 11A.5.5 0 0 1 14.5 13h-13a.5.5 0 0 1-.44-.74l6.5-11A.5.5 0 0 1 8 1zm0 4a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3A.5.5 0 0 0 8 5zm0 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>
                </svg>
              )}
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