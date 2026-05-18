import client from "./client";
import type { ApiResponse } from "@/types";

export interface DashboardStats {
  registeredUsers: number;
  guestVisitsTotal: number;
  guestVisitsLast30Days: number;
}

export const analyticsApi = {
  recordGuestVisit: () => client.post("/analytics/guest-visit"),
  getDashboard: () => client.get<ApiResponse<DashboardStats>>("/analytics/dashboard"),
};
