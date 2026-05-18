import { useState, useEffect, useCallback } from "react";
import { useHabitStore } from "@/store/habit.store";
import HabitCard from "@/components/HabitCard";
import AddHabitModal from "@/components/AddHabitModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Habit, CreateHabitDto, UpdateHabitDto } from "@/types";

export default function HabitsPage() {
  const { habits, loading, fetchHabits, createHabit, updateHabit, deleteHabit, logHabit, unlogHabit } =
    useHabitStore();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const today = new Date().toISOString().slice(0, 10);

  const handleToggleToday = useCallback(
    (habit: Habit) => {
      if (habit.completedToday) {
        unlogHabit(habit.id, today);
      } else {
        logHabit(habit.id);
      }
    },
    [today, logHabit, unlogHabit]
  );

  const handleOpenCreate = () => {
    setEditTarget(null);
    setShowModal(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditTarget(habit);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTarget(null);
  };

  const handleSave = async (dto: CreateHabitDto | UpdateHabitDto) => {
    if (editTarget) {
      await updateHabit(editTarget.id, dto as UpdateHabitDto);
    } else {
      await createHabit(dto as CreateHabitDto);
    }
  };

  const completedCount = habits.filter((h) => h.completedToday).length;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-100">Habits</h1>
          {habits.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {completedCount} / {habits.length} done today
            </p>
          )}
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New Habit</span>
        </button>
      </div>

      {/* Content */}
      {loading && habits.length === 0 ? (
        <div className="text-center py-16 text-slate-600 text-sm">Loading…</div>
      ) : habits.length === 0 ? (
        <div className="card px-6 py-12 flex flex-col items-center text-center gap-3">
          <svg aria-hidden="true" className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-slate-400 font-medium">No habits yet</p>
            <p className="text-slate-600 text-sm mt-1">Build daily routines and track your streaks.</p>
          </div>
          <button onClick={handleOpenCreate} className="btn-primary text-sm py-2 px-6 mt-1">
            Create your first habit
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleToday={() => handleToggleToday(habit)}
              onEdit={() => handleOpenEdit(habit)}
              onDelete={() => setDeleteTarget(habit)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <AddHabitModal
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Habit"
        message={`Delete "${deleteTarget?.title}"? All check-in history will be removed permanently.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteTarget) await deleteHabit(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
