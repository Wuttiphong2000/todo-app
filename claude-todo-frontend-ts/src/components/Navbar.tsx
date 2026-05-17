// src/components/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/utils";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
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
            <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Tasks</span>
          </NavLink>

          <Link
            to="/add"
            className={cn(
              "btn-primary text-sm py-2 px-3 sm:px-4 flex items-center gap-1.5",
              pathname === "/add" && "opacity-70 pointer-events-none"
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Task</span>
          </Link>

          {/* User + Logout */}
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-1">
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-surface-700 px-3 py-1.5 rounded-lg border border-surface-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-red-900/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all border border-surface-600"
                aria-label="Logout"
                title="ออกจากระบบ"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        "h-8 px-3 rounded-lg text-sm font-body transition-all duration-150 flex items-center gap-1.5",
        active
          ? "bg-surface-700 text-slate-200"
          : "text-slate-400 hover:text-slate-200 hover:bg-surface-700/60"
      )}
    >
      {children}
    </Link>
  );
}
