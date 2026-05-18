// src/components/Navbar.tsx
import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useTodoStore } from "@/store/todo.store";
import { useTheme } from "@/context/theme";
import { cn } from "@/utils";
import type { Todo, Tag } from "@/types";

interface BackupFile {
  success: boolean;
  data: { todos: Todo[]; tags: Tag[] };
}

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, isGuest } = useAuthStore();
  const { importBackup } = useTodoStore();
  const { theme, toggle: toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be selected again

    setImporting(true);
    try {
      const text = await file.text();
      const parsed: BackupFile = JSON.parse(text);
      if (!parsed?.data?.todos || !parsed?.data?.tags) {
        alert("ไฟล์ไม่ถูกต้อง — ต้องเป็นไฟล์ backup จาก Doable เท่านั้น");
        return;
      }
      const result = await importBackup(parsed.data);
      alert(`นำเข้าสำเร็จ: ${result.todos} tasks, ${result.tags} tags`);
      navigate("/");
    } catch {
      alert("เกิดข้อผิดพลาดในการนำเข้าข้อมูล — กรุณาตรวจสอบไฟล์");
    } finally {
      setImporting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-surface-600 bg-surface-900/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link
          to="/"
          className="font-display font-extrabold text-lg sm:text-xl tracking-tight flex items-center gap-2 flex-shrink-0"
        >
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent flex items-center justify-center text-surface-950 text-sm font-black">
            D
          </span>
          <span className="text-slate-100 hidden xs:block">doable</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
          <NavLink to="/" active={pathname === "/"}>
            <svg aria-hidden="true" className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Tasks</span>
          </NavLink>

          <NavLink to="/tags" active={pathname === "/tags"}>
            <svg aria-hidden="true" className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="hidden sm:inline">Tags</span>
          </NavLink>

          <NavLink to="/stats" active={pathname === "/stats"}>
            <svg aria-hidden="true" className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-7"/>
            </svg>
            <span className="hidden sm:inline">Stats</span>
          </NavLink>

          <NavLink to="/focus" active={pathname === "/focus"}>
            <svg aria-hidden="true" className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5"/><path d="M9.5 2.5h5M12 2.5v2.5"/>
            </svg>
            <span className="hidden sm:inline">Focus</span>
          </NavLink>

          <NavLink to="/habits" active={pathname === "/habits"}>
            <svg aria-hidden="true" className="w-4 h-4 sm:hidden" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.83-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.08-.46.02-.64-.14a1.19 1.19 0 0 1-.32-.46c-.09-.3-.14-.6-.14-.92C8.7 10.4 8.2 8.8 7 7.4c.89 1.2 1.4 2.6 1.4 3.99-.01.3-.01.61-.04.91C8.16 14.26 9 15.96 9 18c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.15-.83-4.19-2.34-5.8z"/>
            </svg>
            <span className="hidden sm:inline">Habits</span>
          </NavLink>

          <NavLink to="/calendar" active={pathname === "/calendar"}>
            <svg aria-hidden="true" className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Calendar</span>
          </NavLink>

          {!isGuest && user?.username === "wskt" && (
            <NavLink to="/dashboard" active={pathname === "/dashboard"}>
              <svg aria-hidden="true" className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
          )}

          <Link
            to="/add"
            className={cn(
              "btn-primary text-sm py-2 px-3 sm:px-4 flex items-center gap-1.5",
              pathname === "/add" && "opacity-70 pointer-events-none"
            )}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Task</span>
          </Link>

          {/* User section */}
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-1">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors border border-surface-600"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
              >
                {theme === "dark" ? (
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Import button */}
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors border border-surface-600 disabled:opacity-40"
                aria-label="Import backup"
                title="นำเข้าข้อมูล (JSON)"
              >
                {importing ? (
                  <svg aria-hidden="true" className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="sr-only"
                aria-hidden="true"
                onChange={handleFileChange}
              />

              {/* Username badge */}
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-surface-700 px-3 py-1.5 rounded-lg border border-surface-600">
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {user.username}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-red-900/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors border border-surface-600"
                aria-label="Logout"
                title="ออกจากระบบ"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "h-8 px-3 rounded-lg text-sm font-body transition-colors duration-150 flex items-center gap-1.5",
        active
          ? "bg-surface-700 text-slate-200"
          : "text-slate-400 hover:text-slate-200 hover:bg-surface-700/60"
      )}
    >
      {children}
    </Link>
  );
}
