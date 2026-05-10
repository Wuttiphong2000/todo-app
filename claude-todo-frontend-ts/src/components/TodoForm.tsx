// src/components/TodoForm.tsx
import { useState } from "react";
import { nanoid } from "nanoid";
import { useTodoStore } from "@/store/todo.store";
import { TAG_COLORS, cn } from "@/utils";
import type { Todo, CreateTodoDto, UpdateTodoDto, SubTask, Priority } from "@/types";

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
  const [newSubtask, setNewSubtask] = useState("");

  // Tag creation inline
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
        ? // edit mode — send full SubTask objects (backend updateTodoSchema requires id/completed/createdAt)
          { title: title.trim(), description: description.trim() || undefined, priority, tagIds, dueDate: dueDate || null, subtasks }
        : // create mode — send { title } only (backend createTodoSchema)
          { title: title.trim(), description: description.trim() || undefined, priority, tagIds, dueDate: dueDate || null, subtasks: subtasks.map((s) => ({ title: s.title })) }
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
        <label className="label-base">Task *</label>
        <input
          className="input-base text-base"
          placeholder="ชื่อ task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {/* Description */}
      <div>
        <label className="label-base">รายละเอียด</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder="เพิ่มรายละเอียด (ไม่บังคับ)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Priority + Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base">Priority</label>
          <div className="flex gap-2">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-mono border transition-all duration-150",
                  priority === opt.value
                    ? opt.cls
                    : "border-surface-500 text-slate-500 hover:border-surface-400"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-base">Due Date</label>
          <input
            type="date"
            className="input-base text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="label-base">Tags</label>
        <div className="flex flex-wrap gap-2">
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
                className={cn(
                  "text-xs px-3 py-1 rounded-full border transition-all duration-150",
                  selected
                    ? "opacity-100 scale-105"
                    : "opacity-40 hover:opacity-70"
                )}
                style={{
                  backgroundColor: tag.color + "22",
                  borderColor: tag.color + (selected ? "88" : "33"),
                  color: tag.color,
                }}
              >
                {selected ? "✓ " : ""}{tag.name}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowTagForm(!showTagForm)}
            className="text-xs px-3 py-1 rounded-full border border-dashed border-surface-500 text-slate-500 hover:text-slate-300 hover:border-surface-400 transition-all"
          >
            + Tag ใหม่
          </button>
        </div>

        {/* Inline Tag Creator */}
        {showTagForm && (
          <div className="mt-3 p-3 bg-surface-700 rounded-xl border border-surface-500 flex items-center gap-2 animate-slide-up">
            <input
              className="input-base text-xs py-1.5 flex-1"
              placeholder="ชื่อ tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
            />
            <div className="flex gap-1.5">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all",
                    newTagColor === c && "scale-110"
                  )}
                  style={{
                    backgroundColor: c,
                    ...(newTagColor === c
                      ? { outline: `2px solid ${c}`, outlineOffset: "2px" }
                      : {}),
                  }}
                />
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
                onClick={() =>
                  setSubtasks((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-slate-600 hover:text-red-400 transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
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