import client from "./client";
import type { ApiResponse, FocusSession, FocusStats } from "@/types";

export const focusApi = {
  start: async (dto: { todoId?: string | null; duration: number }) => {
    const res = await client.post<ApiResponse<FocusSession>>("/focus/sessions", dto);
    return res.data;
  },

  end: async (id: string, completed: boolean) => {
    const res = await client.patch<ApiResponse<FocusSession>>(`/focus/sessions/${id}`, { completed });
    return res.data;
  },

  getStats: async () => {
    const res = await client.get<ApiResponse<FocusStats>>("/focus/stats");
    return res.data;
  },

  getHistory: async () => {
    const res = await client.get<ApiResponse<FocusSession[]>>("/focus/sessions");
    return res.data;
  },
};
