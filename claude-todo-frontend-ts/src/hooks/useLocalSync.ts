// src/hooks/useLocalSync.ts
import { useEffect } from "react";
import { useTodoStore } from "@/store/todo.store";

const STORAGE_KEY = "todo_app_cache";

/**
 * Syncs Zustand store → localStorage on every change.
 * On first mount, hydrates from localStorage if API is unavailable.
 */
export function useLocalSync() {
  const todos = useTodoStore((s) => s.todos);
  const tags = useTodoStore((s) => s.tags);
  const fetchTodos = useTodoStore((s) => s.fetchTodos);
  const fetchTags = useTodoStore((s) => s.fetchTags);

  // Hydrate from localStorage then fetch fresh data from API
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        useTodoStore.setState({
          todos: parsed.todos ?? [],
          tags: parsed.tags ?? [],
        });
      } catch {
        // ignore corrupt cache
      }
    }
    // Always fetch fresh from API
    fetchTags();
    fetchTodos();
  }, []);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (todos.length === 0 && tags.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ todos, tags }));
  }, [todos, tags]);
}