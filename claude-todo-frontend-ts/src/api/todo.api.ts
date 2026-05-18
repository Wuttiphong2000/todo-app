// src/api/todo.api.ts
import client from "./client";
import type {
  Todo,
  Tag,
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryParams,
  ApiResponse,
} from "@/types";

export const todoApi = {
  getAll: async (params?: TodoQueryParams) => {
    const res = await client.get<ApiResponse<Todo[]>>("/todos", { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await client.get<ApiResponse<Todo>>(`/todos/${id}`);
    return res.data;
  },

  create: async (dto: CreateTodoDto) => {
    const res = await client.post<ApiResponse<Todo>>("/todos", dto);
    return res.data;
  },

  update: async (id: string, dto: UpdateTodoDto) => {
    const res = await client.put<ApiResponse<Todo>>(`/todos/${id}`, dto);
    return res.data;
  },

  patchStatus: async (id: string, status: Todo["status"]) => {
    const res = await client.patch<ApiResponse<Todo> & { meta?: { nextOccurrence?: Todo } }>(`/todos/${id}/status`, {
      status,
    });
    return res.data;
  },

  reorder: async (items: Array<{ id: string; order: number }>) => {
    await client.patch("/todos/reorder", { items });
  },

  delete: async (id: string) => {
    await client.delete(`/todos/${id}`);
  },

  importBackup: async (backup: { todos: Todo[]; tags: Tag[] }) => {
    const res = await client.post<ApiResponse<{ imported: { todos: number; tags: number } }>>(
      "/import",
      backup
    );
    return res.data;
  },
};