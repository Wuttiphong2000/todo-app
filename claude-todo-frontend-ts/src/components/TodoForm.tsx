// src/components/TodoForm.tsx
import { useState } from "react";
import { nanoid } from "nanoid";
import { useTodoStore } from "@/store/todo.store";
import { TAG_COLORS, cn } from "@/utils";
import RecurrenceSelector from "./RecurrenceSelector";
import type { Todo, CreateTodoDto, UpdateTodoDto, SubTask, Priority, Recurrence } from "@/types";

interface Props {
  initial?: Todo;
  onSubmit: (data: CreateTodoDto | UpdateTodoDto) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

export default function TodoForm({
  initial,
  onSubmit,
  submitLabel = "บันทึก",
  loading = false,
}: Props) {
  const { tags, createTag } = useTodoStore();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [subtasks, setSubtasks] = useState<SubTask[]>(initial?.subtasks ?? []);
  const [recurrence, setRecurrence] = useState<Recurrence | null>(initial?.recurrence ?? null);
  const [newSubtask, setNewSubtask] = useState("");

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showTagForm, setShowTagForm] = useState(false);

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: nanoid(),
        title: newSubtask.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewSubtask("");
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tag = await createTag({ name: newTagName.trim(), color: newTagColor });
    setTagIds((prev) => [...prev, tag.id]);
    setNewTagName("");
    setShowTagForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit(
      initial
        ? { title: title.trim(), description: description.trim() || undefined, priority, tagIds, dueDate: dueDate || null, subtasks, recurrence }
        : { title: title.trim(), description: description.trim() || undefined, priority, tagIds, dueDate: dueDate || null, subtasks: subtasks.map((s) => ({ title: s.title })), recurrence }
    );
  };

  const priorityOptions: { value: Priority; label: string; cls: string }[] = [
    { value: "low",    label: "Low",    cls: "badge-priority-low"    },
    { value: "medium", label: "Medium", cls: "badge-priority-medium" },
    { value: "high",   label: "High",   cls: "badge-priority-high"   },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="task-title" className="label-base">Task *</label>
        <input
          id="task-title"
          name="title"
          autoComplete="off"
          className="input-base text-base"
          placeholder="ชื่อ task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="task-description" className="label-base">รายละเอียด</label>
        <textarea
          id="task-description"
          name="description"
          autoComplete="off"
          className="input-base resize-none"
          rows={3}
          placeholder="เพิ่มรายละเอียด (ไม่บังคับ)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Priority + Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label-base" id="priority-label">Priority</label>
          <div className="flex gap-2" role="group" aria-labelledby="priority-label">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-mono border duration-150",
                  priority === opt.value
                    ? opt.cls
                    : "border-surface-500 text-slate-500 hover:border-surface-400"
                )}
                style={{
                  transitionProperty: "background-color, border-color, color",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="task-due-date" className="label-base">Due Date</label>
          <input
            id="task-due-date"
            name="due-date"
            type="date"
            className="input-base text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label className="label-base">Repeat</label>
        <RecurrenceSelector value={recurrence} onChange={setRecurrence} />
      </div>

      {/* Tags */}
      <div>
        <label className="label-base" id="tags-label">Tags</label>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="tags-label">
          {tags.map((tag) => {
            const selected = tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setTagIds((prev) =>
                    selected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                  )
                }
                aria-pressed={selected}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border duration-150 inline-flex items-center gap-1",
                  selected ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"
                )}
                style={{
                  backgroundColor: tag.color + "22",
                  borderColor: tag.color + (selected ? "88" : "33"),
                  color: tag.color,
                  transitionProperty: "opacity, transform, border-color",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {selected && (
                  <svg aria-hidden="true" className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {tag.name}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowTagForm(!showTagForm)}
            className="text-xs px-3 py-1 rounded-full border border-dashed border-surface-500 text-slate-500 hover:text-slate-300 hover:border-surface-400"
            style={{
              transitionProperty: "color, border-color",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDuration: "150ms",
            }}
          >
            + Tag ใหม่
          </button>
        </div>

        {/* Inline Tag Creator */}
        {showTagForm && (
          <div className="mt-3 p-3 bg-surface-700 rounded-xl border border-surface-500 flex items-center gap-2 animate-slide-up">
            <label htmlFor="tag-name-input" className="sr-only">ชื่อ tag</label>
            <input
              id="tag-name-input"
              name="tag-name"
              autoComplete="off"
              className="input-base text-xs py-1.5 flex-1"
              placeholder="ชื่อ tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
            />
            <div className="flex gap-1" role="group" aria-label="เลือกสี tag">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  aria-label={`สี ${c}`}
                  aria-pressed={newTagColor === c}
                  className={cn(
                    "relative flex items-center justify-center rounded-full duration-150 -mx-[2px]",
                    newTagColor === c ? "scale-110" : ""
                  )}
                  style={{
                    width: 32,
                    height: 32,
                    transitionProperty: "transform",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <span
                    className="block w-5 h-5 rounded-full"
                    style={{
                      backgroundColor: c,
                      ...(newTagColor === c ? { outline: `2px solid ${c}`, outlineOffset: "2px" } : {}),
                    }}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCreateTag}
              className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
            >
              เพิ่ม
            </button>
          </div>
        )}
      </div>

      {/* Subtasks */}
      <div>
        <label className="label-base">Subtasks</label>
        <div className="space-y-2 mb-2">
          {subtasks.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-2 bg-surface-700 px-3 py-2 rounded-lg text-sm text-slate-300"
            >
              <span className="text-slate-600 font-mono text-xs">{i + 1}.</span>
              <span className="flex-1">{s.title}</span>
              <button
                type="button"
                onClick={() => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-slate-600 hover:text-red-400 flex-shrink-0 p-1 -m-1 rounded"
                aria-label={`ลบ subtask: ${s.title}`}
                style={{
                  transitionProperty: "color",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  transitionDuration: "150ms",
                }}
              >
                <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <label htmlFor="subtask-input" className="sr-only">เพิ่ม subtask</label>
          <input
            id="subtask-input"
            name="subtask"
            autoComplete="off"
            className="input-base text-sm flex-1"
            placeholder="เพิ่ม subtask..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtask();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddSubtask}
            className="btn-ghost border border-surface-500 px-4"
          >
            +
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!title.trim() || loading}
        className="btn-primary w-full py-3 text-base"
      >
        {loading ? "กำลังบันทึก..." : submitLabel}
      </button>
    </div>
  );
}
