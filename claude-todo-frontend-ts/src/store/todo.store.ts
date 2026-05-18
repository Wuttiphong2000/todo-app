// src/store/todo.store.ts
import { create } from "zustand";
import { todoApi } from "@/api/todo.api";
import { tagApi } from "@/api/tag.api";
import type {
  Todo,
  Tag,
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryParams,
  CreateTagDto,
  UpdateTagDto,
} from "@/types";

interface TodoStore {
  todos: Todo[];
  tags: Tag[];
  loading: boolean;
  error: string | null;

  // ── Todos ──
  fetchTodos: (params?: TodoQueryParams) => Promise<void>;
  createTodo: (dto: CreateTodoDto) => Promise<Todo>;
  updateTodo: (id: string, dto: UpdateTodoDto) => Promise<void>;
  patchStatus: (id: string, status: Todo["status"]) => Promise<void>;
  reorderTodos: (reordered: Todo[]) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  // ── Tags ──
  fetchTags: () => Promise<void>;
  createTag: (dto: CreateTagDto) => Promise<Tag>;
  updateTag: (id: string, dto: UpdateTagDto) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // ── Backup ──
  importBackup: (backup: { todos: Todo[]; tags: Tag[] }) => Promise<{ todos: number; tags: number }>;

  // ── Helpers ──
  clearError: () => void;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  tags: [],
  loading: false,
  error: null,

  // ── Todos ──────────────────────────────────────────────────────────────────

  fetchTodos: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await todoApi.getAll(params);
      set({ todos: res.data, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createTodo: async (dto) => {
    const res = await todoApi.create(dto);
    set((s) => ({ todos: [...s.todos, res.data] }));
    return res.data;
  },

  updateTodo: async (id, dto) => {
    const res = await todoApi.update(id, dto);
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? res.data : t)),
    }));
  },

  patchStatus: async (id, status) => {
    // Optimistic update
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id
          ? { ...t, status, completedAt: status === "done" ? new Date().toISOString() : null }
          : t
      ),
    }));
    try {
      const res = await todoApi.patchStatus(id, status);
      set((s) => {
        const updated = s.todos.map((t) => (t.id === id ? res.data : t));
        const next = res.meta?.nextOccurrence;
        return { todos: next ? [...updated, next] : updated };
      });
    } catch (e) {
      // Rollback on error
      await get().fetchTodos();
      throw e;
    }
  },

  reorderTodos: async (reordered) => {
    const previous = get().todos;
    set({ todos: reordered });
    try {
      await todoApi.reorder(reordered.map((t, i) => ({ id: t.id, order: i })));
    } catch {
      set({ todos: previous });
    }
  },

  deleteTodo: async (id) => {
    await todoApi.delete(id);
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
  },

  // ── Tags ───────────────────────────────────────────────────────────────────

  fetchTags: async () => {
    try {
      const res = await tagApi.getAll();
      set({ tags: res.data });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createTag: async (dto) => {
    const res = await tagApi.create(dto);
    set((s) => ({ tags: [...s.tags, res.data] }));
    return res.data;
  },

  updateTag: async (id, dto) => {
    const res = await tagApi.update(id, dto);
    set((s) => ({
      tags: s.tags.map((t) => (t.id === id ? res.data : t)),
    }));
  },

  deleteTag: async (id) => {
    await tagApi.delete(id);
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      todos: s.todos.map((todo) => ({
        ...todo,
        tagIds: todo.tagIds.filter((tid) => tid !== id),
      })),
    }));
  },

  importBackup: async (backup) => {
    const res = await todoApi.importBackup(backup);
    await Promise.all([get().fetchTags(), get().fetchTodos()]);
    return res.data.imported;
  },

  clearError: () => set({ error: null }),
}));