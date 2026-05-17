import { create } from "zustand";
import client from "@/api/client";

interface AuthUser {
  id: string;
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  hydrate: () => {
    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem("auth_user");
    if (token && raw) {
      try {
        set({ token, user: JSON.parse(raw) });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await client.post<{ token: string; user: AuthUser }>(
        "/auth/login",
        { username, password }
      );
      const { token, user } = res.data as unknown as { token: string; user: AuthUser };
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      set({ token, user, loading: false });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("todo_app_cache");
    set({ token: null, user: null });
  },
}));
