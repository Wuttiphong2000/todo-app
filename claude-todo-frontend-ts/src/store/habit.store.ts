import { create } from "zustand";
import { habitApi } from "@/api/habit.api";
import type { Habit, CreateHabitDto, UpdateHabitDto } from "@/types";

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
    set({ loading: true });
    try {
      const res = await habitApi.getAll();
      set({ habits: res.data });
    } finally {
      set({ loading: false });
    }
  },

  createHabit: async (dto) => {
    const res = await habitApi.create(dto);
    const habit = res.data;
    set((s) => ({ habits: [...s.habits, habit] }));
    return habit;
  },

  updateHabit: async (id, dto) => {
    const res = await habitApi.update(id, dto);
    const updated = res.data;
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? updated : h)) }));
  },

  deleteHabit: async (id) => {
    await habitApi.delete(id);
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
  },

  logHabit: async (id) => {
    const res = await habitApi.log(id);
    const updated = res.data;
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? updated : h)) }));
  },

  unlogHabit: async (id, date) => {
    const res = await habitApi.unlog(id, date);
    const updated = res.data;
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? updated : h)) }));
  },
}));
