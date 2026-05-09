// src/components/Navbar.tsx
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-600 bg-surface-900/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-display font-extrabold text-xl tracking-tight flex items-center gap-2.5"
        >
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-surface-950 text-sm font-black">
            D
          </span>
          <span className="text-slate-100">
            doable
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" active={pathname === "/"}>
            Tasks
          </NavLink>
          <Link
            to="/add"
            className={cn(
              "btn-primary text-sm py-2 px-4",
              pathname === "/add" && "opacity-70 pointer-events-none"
            )}
          >
            + New Task
          </Link>
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
        "px-3 py-1.5 rounded-lg text-sm font-body transition-all duration-150",
        active
          ? "bg-surface-700 text-slate-200"
          : "text-slate-400 hover:text-slate-200 hover:bg-surface-700/60"
      )}
    >
      {children}
    </Link>
  );
}