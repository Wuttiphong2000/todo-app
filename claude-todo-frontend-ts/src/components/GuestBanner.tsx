import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useTodoStore } from "@/store/todo.store";

export default function GuestBanner() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { todos, tags } = useTodoStore();

  const handleExport = () => {
    const data = { todos, tags };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guest-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogin = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-amber-300 min-w-0">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <span className="truncate">Guest Mode — ข้อมูลเก็บในเครื่องนี้เท่านั้น ล้าง browser data = ข้อมูลหาย</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={handleExport} className="btn-ghost text-xs px-2 py-1 text-amber-300 hover:text-amber-100">
          Export
        </button>
        <button onClick={handleLogin} className="btn-primary text-xs px-3 py-1">
          Login
        </button>
      </div>
    </div>
  );
}
