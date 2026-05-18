// src/store/todo.store.ts
import { create } from "zustand";
import { nanoid } from "nanoid";
import { todoApi } from "@/api/todo.api";
import { tagApi } from "@/api/tag.api";
import { useAuthStore } from "@/store/auth.store";
import type {
  Todo,
  Tag,
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryParams,
  CreateTagDto,
  UpdateTagDto,
} from "@/types";

// ── Guest localStorage helpers ────────────────────────────────────────────────

function loadGuest<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function saveGuest<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
const GT = "guest_todos";
const GG = "guest_tags";

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
    if (useAuthStore.getState().isGuest) {
      let todos = loadGuest<Todo>(GT);
      if (params?.status) todos = todos.filter((t) => t.status === params.status);
      if (params?.priority) todos = todos.filter((t) => t.priority === params.priority);
      if (params?.q) todos = todos.filter((t) => t.title.toLowerCase().includes(params.q!.toLowerCase()));
      set({ todos, loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const res = await todoApi.getAll(params);
      set({ todos: res.data, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createTodo: async (dto) => {
    if (useAuthStore.getState().isGuest) {
      const now = new Date().toISOString();
      const todo: Todo = {
        id: nanoid(),
        title: dto.title,
        description: dto.description ?? null,
        status: "pending",
        priority: dto.priority ?? "medium",
        tagIds: dto.tagIds ?? [],
        subtasks: (dto.subtasks ?? []).map((s) => ({ id: nanoid(), title: s.title, completed: false, createdAt: now })),
        dueDate: dto.dueDate ?? null,
        recurrence: dto.recurrence ?? null,
        order: loadGuest<Todo>(GT).length,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };
      set((s) => { const todos = [...s.todos, todo]; saveGuest(GT, todos); return { todos }; });
      return todo;
    }
    const res = await todoApi.create(dto);
    set((s) => ({ todos: [...s.todos, res.data] }));
    return res.data;
  },

  updateTodo: async (id, dto) => {
    if (useAuthStore.getState().isGuest) {
      const now = new Date().toISOString();
      set((s) => {
        const todos = s.todos.map((t) =>
          t.id === id ? { ...t, ...dto, subtasks: dto.subtasks ?? t.subtasks, updatedAt: now } : t
        );
        saveGuest(GT, todos);
        return { todos };
      });
      return;
    }
    const res = await todoApi.update(id, dto);
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? res.data : t)) }));
  },

  patchStatus: async (id, status) => {
    if (useAuthStore.getState().isGuest) {
      const now = new Date().toISOString();
      set((s) => {
        const todos = s.todos.map((t) =>
          t.id === id ? { ...t, status, completedAt: status === "done" ? now : null, updatedAt: now } : t
        );
        saveGuest(GT, todos);
        return { todos };
      });
      return;
    }
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, status, completedAt: status === "done" ? new Date().toISOString() : null } : t
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
      await get().fetchTodos();
      throw e;
    }
  },

  reorderTodos: async (reordered) => {
    if (useAuthStore.getState().isGuest) {
      const todos = reordered.map((t, i) => ({ ...t, order: i }));
      saveGuest(GT, todos);
      set({ todos });
      return;
    }
    const previous = get().todos;
    set({ todos: reordered });
    try {
      await todoApi.reorder(reordered.map((t, i) => ({ id: t.id, order: i })));
    } catch {
      set({ todos: previous });
    }
  },

  deleteTodo: async (id) => {
    if (useAuthStore.getState().isGuest) {
      set((s) => { const todos = s.todos.filter((t) => t.id !== id); saveGuest(GT, todos); return { todos }; });
      return;
    }
    await todoApi.delete(id);
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
  },

  // ── Tags ───────────────────────────────────────────────────────────────────

  fetchTags: async () => {
    if (useAuthStore.getState().isGuest) {
      set({ tags: loadGuest<Tag>(GG) });
      return;
    }
    try {
      const res = await tagApi.getAll();
      set({ tags: res.data });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createTag: async (dto) => {
    if (useAuthStore.getState().isGuest) {
      const tag: Tag = { id: nanoid(), name: dto.name, color: dto.color, createdAt: new Date().toISOString() };
      set((s) => { const tags = [...s.tags, tag]; saveGuest(GG, tags); return { tags }; });
      return tag;
    }
    const res = await tagApi.create(dto);
    set((s) => ({ tags: [...s.tags, res.data] }));
    return res.data;
  },

  updateTag: async (id, dto) => {
    if (useAuthStore.getState().isGuest) {
      set((s) => { const tags = s.tags.map((t) => (t.id === id ? { ...t, ...dto } : t)); saveGuest(GG, tags); return { tags }; });
      return;
    }
    const res = await tagApi.update(id, dto);
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? res.data : t)) }));
  },

  deleteTag: async (id) => {
    if (useAuthStore.getState().isGuest) {
      set((s) => {
        const tags = s.tags.filter((t) => t.id !== id);
        const todos = s.todos.map((todo) => ({ ...todo, tagIds: todo.tagIds.filter((tid) => tid !== id) }));
        saveGuest(GG, tags);
        saveGuest(GT, todos);
        return { tags, todos };
      });
      return;
    }
    await tagApi.delete(id);
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      todos: s.todos.map((todo) => ({ ...todo, tagIds: todo.tagIds.filter((tid) => tid !== id) })),
    }));
  },

  importBackup: async (backup) => {
    if (useAuthStore.getState().isGuest) {
      saveGuest(GT, backup.todos);
      saveGuest(GG, backup.tags);
      set({ todos: backup.todos, tags: backup.tags });
      return { todos: backup.todos.length, tags: backup.tags.length };
    }
    const res = await todoApi.importBackup(backup);
    await Promise.all([get().fetchTags(), get().fetchTodos()]);
    return res.data.imported;
  },

  clearError: () => set({ error: null }),
}));