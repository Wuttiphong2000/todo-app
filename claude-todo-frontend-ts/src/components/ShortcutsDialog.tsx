import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "N", description: "New task" },
  { key: "/", description: "Focus search" },
  { key: "Escape", description: "Clear search / blur" },
  { key: "?", description: "Show this dialog" },
] as const;

export default function ShortcutsDialog({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        className="relative card p-6 w-full max-w-xs shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id="shortcuts-dialog-title"
            className="font-display font-bold text-base text-slate-100"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-surface-700 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shortcut list */}
        <div className="space-y-1">
          {SHORTCUTS.map(({ key, description }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-surface-700 last:border-0"
            >
              <span className="text-sm text-slate-400">{description}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-surface-700 text-slate-300 rounded border border-surface-500 min-w-[2rem] text-center">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
