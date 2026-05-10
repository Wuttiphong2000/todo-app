import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TodoCard from "./TodoCard";
import type { Todo } from "@/types";
import { cn } from "@/utils";

interface Props {
  todo: Todo;
  tags: { id: string; name: string; color: string }[];
}

function GripIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.5" />
      <circle cx="11" cy="4" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="11" cy="12" r="1.5" />
    </svg>
  );
}

export default function SortableTodoCard({ todo, tags }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const handleProps = {
    ...attributes,
    ...listeners,
  } as React.ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40 z-50 relative")}
    >
      <TodoCard
        todo={todo}
        tags={tags}
        dragHandle={
          <button
            {...handleProps}
            className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-400 transition-colors flex items-center justify-center"
            aria-label="Drag to reorder"
          >
            <GripIcon />
          </button>
        }
      />
    </div>
  );
}
