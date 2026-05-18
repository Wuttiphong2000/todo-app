import client from "./client";
import type { ApiResponse, DashboardStats } from "@/types";

export const statsApi = {
  getStats: async () => {
    const res = await client.get<ApiResponse<DashboardStats>>("/stats");
    return res.data;
  },
};
