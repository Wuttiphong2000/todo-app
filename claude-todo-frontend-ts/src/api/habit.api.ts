import client from "./client";
import type { ApiResponse, Habit, CreateHabitDto, UpdateHabitDto } from "@/types";

export const habitApi = {
  getAll: async () => {
    const res = await client.get<ApiResponse<Habit[]>>("/habits");
    return res.data;
  },

  create: async (dto: CreateHabitDto) => {
    const res = await client.post<ApiResponse<Habit>>("/habits", dto);
    return res.data;
  },

  update: async (id: string, dto: UpdateHabitDto) => {
    const res = await client.put<ApiResponse<Habit>>(`/habits/${id}`, dto);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await client.delete<ApiResponse<null>>(`/habits/${id}`);
    return res.data;
  },

  log: async (id: string, date?: string) => {
    const res = await client.post<ApiResponse<Habit>>(`/habits/${id}/log`, { date });
    return res.data;
  },

  unlog: async (id: string, date: string) => {
    const res = await client.delete<ApiResponse<Habit>>(`/habits/${id}/log/${date}`);
    return res.data;
  },
};
