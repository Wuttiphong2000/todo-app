// src/api/tag.api.ts
import client from "./client";
import type { Tag, CreateTagDto, ApiResponse } from "@/types";

export const tagApi = {
  getAll: async () => {
    const res = await client.get<ApiResponse<Tag[]>>("/tags");
    return res.data;
  },

  create: async (dto: CreateTagDto) => {
    const res = await client.post<ApiResponse<Tag>>("/tags", dto);
    return res.data;
  },

  update: async (id: string, dto: Partial<CreateTagDto>) => {
    const res = await client.put<ApiResponse<Tag>>(`/tags/${id}`, dto);
    return res.data;
  },

  delete: async (id: string) => {
    await client.delete(`/tags/${id}`);
  },
};