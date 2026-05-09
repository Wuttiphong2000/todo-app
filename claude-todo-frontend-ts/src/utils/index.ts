// src/utils/index.ts
import type { Priority, Status } from "@/types";

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

export const PRIORITY_CLASS: Record<Priority, string> = {
  low:    "badge-priority-low",
  medium: "badge-priority-medium",
  high:   "badge-priority-high",
};

export const STATUS_CLASS: Record<Status, string> = {
  pending:     "badge-status-pending",
  in_progress: "badge-status-in_progress",
  done:        "badge-status-done",
};

export const TAG_COLORS = [
  "#e05a5a", "#e8a045", "#4caf82", "#5a8de0",
  "#9b5ae0", "#e05aaa", "#5ae0d4", "#a0c45a",
];

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(dueDate: string | null, status: Status): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate) < new Date();
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}