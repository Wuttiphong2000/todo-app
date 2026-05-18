import { create } from "zustand";
import client from "@/api/client";
import { analyticsApi } from "@/api/analytics.api";
import type { ApiResponse } from "@/types";

interface AuthUser {
  id: string;
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isGuest: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

const GUEST_USER: AuthUser = { id: "guest", username: "Guest" };

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isGuest: false,
  loading: false,
  error: null,

  hydrate: () => {
    // Restore guest session
    if (localStorage.getItem("auth_guest") === "true") {
      set({ user: GUEST_USER, token: null, isGuest: true });
      return;
    }

    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem("auth_user");
    if (!token || !raw) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1])) as { exp: number };
      if (payload.exp * 1000 < Date.now()) throw new Error("expired");
      set({ token, user: JSON.parse(raw) });
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await client.post<ApiResponse<{ token: string; user: AuthUser }>>(
        "/auth/login",
        { username, password }
      );
      const { token, user } = res.data.data!;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      set({ token, user, isGuest: false, loading: false });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      set({ error: msg, loading: false });
      return false;
    }
  },

  loginAsGuest: async () => {
    try {
      await analyticsApi.recordGuestVisit();
    } catch {
      // analytics failure must not block guest access
    }
    localStorage.setItem("auth_guest", "true");
    set({ user: GUEST_USER, token: null, isGuest: true });
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_guest");
    localStorage.removeItem("todo_app_cache");
    localStorage.removeItem("guest_todos");
    localStorage.removeItem("guest_tags");
    localStorage.removeItem("guest_habits");
    localStorage.removeItem("guest_habit_logs");
    set({ token: null, user: null, isGuest: false });
  },
}));
