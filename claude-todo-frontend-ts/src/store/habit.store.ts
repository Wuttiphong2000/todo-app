import { create } from "zustand";
import { nanoid } from "nanoid";
import { habitApi } from "@/api/habit.api";
import { useAuthStore } from "@/store/auth.store";
import type { Habit, CreateHabitDto, UpdateHabitDto } from "@/types";

function loadHabits(): Habit[] {
  try { return JSON.parse(localStorage.getItem("guest_habits") ?? "[]"); } catch { return []; }
}
function saveHabits(habits: Habit[]) {
  localStorage.setItem("guest_habits", JSON.stringify(habits));
}
function today() { return new Date().toISOString().slice(0, 10); }

interface HabitState {
  habits: Habit[];
  loading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (dto: CreateHabitDto) => Promise<Habit>;
  updateHabit: (id: string, dto: UpdateHabitDto) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  logHabit: (id: string) => Promise<void>;
  unlogHabit: (id: string, date: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  loading: false,

  fetchHabits: async () => {
    if (useAuthStore.getState().isGuest) {
      set({ habits: loadHabits(), loading: false });
      return;
    }
    set({ loading: true });
    try {
      const res = await habitApi.getAll();
      set({ habits: res.data });
    } finally {
      set({ loading: false });
    }
  },

  createHabit: async (dto) => {
    if (useAuthStore.getState().isGuest) {
      const now = new Date().toISOString();
      const habit: Habit = {
        id: nanoid(), title: dto.title, color: dto.color ?? "#6366f1",
        frequency: dto.frequency ?? "daily", targetDays: dto.targetDays ?? null,
        createdAt: now, logs: [],
      };
      set((s) => { const habits = [...s.habits, habit]; saveHabits(habits); return { habits }; });
      return habit;
    }
    const res = await habitApi.create(dto);
    set((s) => ({ habits: [...s.habits, res.data] }));
    return res.data;
  },

  updateHabit: async (id, dto) => {
    if (useAuthStore.getState().isGuest) {
      set((s) => { const habits = s.habits.map((h) => (h.id === id ? { ...h, ...dto } : h)); saveHabits(habits); return { habits }; });
      return;
    }
    const res = await habitApi.update(id, dto);
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? res.data : h)) }));
  },

  deleteHabit: async (id) => {
    if (useAuthStore.getState().isGuest) {
      set((s) => { const habits = s.habits.filter((h) => h.id !== id); saveHabits(habits); return { habits }; });
      return;
    }
    await habitApi.delete(id);
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
  },

  logHabit: async (id) => {
    if (useAuthStore.getState().isGuest) {
      const date = today();
      const logEntry = { id: nanoid(), habitId: id, userId: "guest", date, createdAt: new Date().toISOString() };
      set((s) => {
        const habits = s.habits.map((h) =>
          h.id === id ? { ...h, logs: [...(h.logs ?? []).filter((l) => l.date !== date), logEntry] } : h
        );
        saveHabits(habits);
        return { habits };
      });
      return;
    }
    const res = await habitApi.log(id);
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? res.data : h)) }));
  },

  unlogHabit: async (id, date) => {
    if (useAuthStore.getState().isGuest) {
      set((s) => {
        const habits = s.habits.map((h) =>
          h.id === id ? { ...h, logs: (h.logs ?? []).filter((l) => l.date !== date) } : h
        );
        saveHabits(habits);
        return { habits };
      });
      return;
    }
    const res = await habitApi.unlog(id, date);
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? res.data : h)) }));
  },
}));
