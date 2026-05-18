// src/pages/TagsPage.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useTodoStore } from "@/store/todo.store";
import ConfirmDialog from "@/components/ConfirmDialog";
import { TAG_COLORS, cn } from "@/utils";
import type { Tag } from "@/types";

export default function TagsPage() {
  const { tags, todos, fetchTags, fetchTodos, updateTag, deleteTag } = useTodoStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTags();
    fetchTodos();
  }, []);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const usageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tag of tags) counts[tag.id] = 0;
    for (const todo of todos) {
      for (const tagId of todo.tagIds) {
        if (tagId in counts) counts[tagId]++;
      }
    }
    return counts;
  }, [tags, todos]);

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateTag(id, { name: editName.trim(), color: editColor });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await deleteTag(confirmDeleteId);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const confirmTag = tags.find((t) => t.id === confirmDeleteId);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-slate-100">Tags</h1>
        <p className="text-sm text-slate-500 mt-1">
          {tags.length} tag{tags.length !== 1 ? "s" : ""} · คลิกแก้ไขเพื่อเปลี่ยนชื่อหรือสี
        </p>
      </div>

      {tags.length === 0 ? (
        <EmptyTags />
      ) : (
        <div className="space-y-2">
          {tags.map((tag) =>
            editingId === tag.id ? (
              <TagEditRow
                key={tag.id}
                editInputRef={editInputRef}
                name={editName}
                color={editColor}
                saving={saving}
                onNameChange={setEditName}
                onColorChange={setEditColor}
                onSave={() => saveEdit(tag.id)}
                onCancel={cancelEdit}
              />
            ) : (
              <TagDisplayRow
                key={tag.id}
                tag={tag}
                count={usageCounts[tag.id] ?? 0}
                onEdit={() => startEdit(tag)}
                onDelete={() => setConfirmDeleteId(tag.id)}
              />
            )
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="ลบ Tag นี้?"
        message={`"${confirmTag?.name}" จะถูกลบออกจากทุก task ที่ใช้ tag นี้`}
        confirmLabel={deleting ? "กำลังลบ..." : "ลบถาวร"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TagDisplayRow({
  tag,
  count,
  onEdit,
  onDelete,
}: {
  tag: Tag;
  count: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card p-4 flex items-center gap-3 group hover:border-surface-500 transition-colors duration-150">
      {/* Color dot */}
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: tag.color }}
      />

      {/* Name */}
      <span
        className="flex-1 font-body text-slate-200 text-sm"
        style={{ color: tag.color }}
      >
        {tag.name}
      </span>

      {/* Usage count */}
      <span className="text-xs text-slate-600 font-mono mr-2 tabular-nums">
        {count} task{count !== 1 ? "s" : ""}
      </span>

      {/* Actions */}
      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          aria-label={`Edit tag ${tag.name}`}
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
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
          onClick={onDelete}
          className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-red-900/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
          aria-label={`Delete tag ${tag.name}`}
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
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
  );
}

function TagEditRow({
  editInputRef,
  name,
  color,
  saving,
  onNameChange,
  onColorChange,
  onSave,
  onCancel,
}: {
  editInputRef: React.Ref<HTMLInputElement>;
  name: string;
  color: string;
  saving: boolean;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card p-4 border-accent/40 bg-surface-700/50">
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Name input */}
        <label htmlFor="tag-edit-name" className="sr-only">ชื่อ tag</label>
        <input
          id="tag-edit-name"
          ref={editInputRef}
          className="input-base text-sm flex-1 min-w-0"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
        />

        {/* Color picker */}
        <div className="flex gap-0.5" role="group" aria-label="เลือกสี tag">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              aria-label={`สี ${c}`}
              aria-pressed={color === c}
              className={cn(
                "flex items-center justify-center rounded-full transition-transform duration-150",
                color === c ? "scale-110" : "hover:scale-105"
              )}
              style={{ width: 32, height: 32 }}
            >
              <span
                className="block w-5 h-5 rounded-full"
                style={{
                  backgroundColor: c,
                  ...(color === c ? { outline: `2px solid ${c}`, outlineOffset: "2px" } : {}),
                }}
              />
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onSave}
            disabled={!name.trim() || saving}
            className="btn-primary text-xs py-1.5 px-4"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-xs py-1.5 px-3 border border-surface-500"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyTags() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center mb-4">
        <svg aria-hidden="true" className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      </div>
      <h3 className="font-display font-semibold text-slate-300 mb-1">ยังไม่มี Tag</h3>
      <p className="text-sm text-slate-600">เพิ่ม tag ได้จากหน้าสร้างหรือแก้ไข task</p>
    </div>
  );
}
