import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { statsApi } from "@/api/stats.api";
import { cn } from "@/utils";
import type { DashboardStats } from "@/types";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(dateStr: string) {
  return DAYS_SHORT[new Date(dateStr + "T12:00:00Z").getUTCDay()];
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: DashboardStats["completionTrend"] }) {
  const today = new Date().toISOString().slice(0, 10);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const SLOT = 40, PAD = 20, CHART_H = 72, LABEL_H = 22;
  const BAR_W = 26, BAR_PAD = (SLOT - BAR_W) / 2;
  const W = PAD * 2 + SLOT * 7, H = CHART_H + LABEL_H + 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {data.map((d, i) => {
        const isToday = d.date === today;
        const barH = d.count === 0 ? 0 : Math.max(4, (d.count / maxCount) * CHART_H);
        const x = PAD + i * SLOT + BAR_PAD;
        const y = CHART_H - barH;
        return (
          <g key={d.date}>
            {d.count === 0 ? (
              <rect x={x} y={CHART_H - 2} width={BAR_W} height={2} fill="#334155" rx={1} />
            ) : (
              <rect x={x} y={y} width={BAR_W} height={barH}
                fill={isToday ? "#F59E0B" : "#7C3AED"} fillOpacity={isToday ? 1 : 0.65} rx={3}
              />
            )}
            {d.count > 0 && (
              <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" fontSize={8} fill="#94a3b8">{d.count}</text>
            )}
            <text
              x={x + BAR_W / 2} y={CHART_H + LABEL_H}
              textAnchor="middle" fontSize={9}
              fill={isToday ? "#F59E0B" : "#64748b"}
              fontWeight={isToday ? "bold" : "normal"}
            >
              {isToday ? "Today" : dayLabel(d.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS = { high: "#f87171", medium: "#fbbf24", low: "#64748b" } as const;

function DonutChart({ breakdown }: { breakdown: DashboardStats["priorityBreakdown"] }) {
  const r = 45, C = 2 * Math.PI * r;
  const total = breakdown.high + breakdown.medium + breakdown.low;
  const segments = [
    { key: "high" as const,   label: "High",   value: breakdown.high },
    { key: "medium" as const, label: "Medium", value: breakdown.medium },
    { key: "low" as const,    label: "Low",    value: breakdown.low },
  ];
  let cum = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 110 110" className="w-32 h-32">
        <g transform="rotate(-90 55 55)">
          {total === 0 ? (
            <circle cx="55" cy="55" r={r} fill="none" stroke="#1e2738" strokeWidth="12" />
          ) : (
            segments.map((s) => {
              if (s.value === 0) return null;
              const len = (s.value / total) * C;
              const offset = -cum;
              cum += len;
              return (
                <circle key={s.key} cx="55" cy="55" r={r} fill="none"
                  stroke={PRIORITY_COLORS[s.key]} strokeWidth="12"
                  strokeDasharray={`${len} ${C}`} strokeDashoffset={offset}
                />
              );
            })
          )}
        </g>
        <text x="55" y="51" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#e2e8f0">{total}</text>
        <text x="55" y="64" textAnchor="middle" fontSize="8" fill="#64748b">active</text>
      </svg>

      <div className="flex gap-4 text-xs">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[s.key] }} />
            <span className="text-slate-500">{s.label}</span>
            <span className="text-slate-300 font-mono font-semibold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) return;
    statsApi.getStats().then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, [isGuest]);

  if (isGuest) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="card p-10 flex flex-col items-center gap-4 text-center">
          <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-lg font-semibold text-slate-300">Statistics ต้องการบัญชี</h2>
          <p className="text-sm text-slate-500 max-w-xs">Stats ต้องการข้อมูล Focus session จาก server — Login เพื่อดู statistics แบบเต็ม</p>
          <Link to="/login" className="btn-primary px-6 py-2">Login</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-24 flex justify-center">
        <div className="w-8 h-8 border-2 border-surface-600 border-t-accent rounded-full animate-spin" />
      </main>
    );
  }
  if (!stats) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-xl text-slate-100 mb-6">Statistics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={cn("card px-4 py-3", stats.streak > 0 && "border-amber-500/30")}>
          <div className="flex items-center gap-1.5">
            <svg aria-hidden="true" className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.83-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.08-.46.02-.64-.14a1.19 1.19 0 0 1-.32-.46c-.09-.3-.14-.6-.14-.92C8.7 10.4 8.2 8.8 7 7.4c.89 1.2 1.4 2.6 1.4 3.99-.01.3-.01.61-.04.91C8.16 14.26 9 15.96 9 18c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.15-.83-4.19-2.34-5.8z"/>
            </svg>
            <span className="font-display font-bold text-2xl text-amber-400">{stats.streak}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">day streak</p>
        </div>
        <div className="card px-4 py-3">
          <p className="font-display font-bold text-2xl text-emerald-400">{stats.totalCompleted}</p>
          <p className="text-xs text-slate-500 mt-0.5">completed</p>
        </div>
        <div className="card px-4 py-3">
          <p className="font-display font-bold text-2xl text-slate-300">{stats.totalActive}</p>
          <p className="text-xs text-slate-500 mt-0.5">active tasks</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <h2 className="font-display font-semibold text-sm text-slate-400 mb-4">Completions — Last 7 Days</h2>
          <BarChart data={stats.completionTrend} />
        </div>
        <div className="card p-4">
          <h2 className="font-display font-semibold text-sm text-slate-400 mb-4">Priority Breakdown</h2>
          <div className="flex justify-center">
            <DonutChart breakdown={stats.priorityBreakdown} />
          </div>
        </div>
      </div>

      {/* Overdue */}
      {stats.overdueList.length > 0 ? (
        <div className="card p-4">
          <h2 className="font-display font-semibold text-sm text-red-400 mb-3 flex items-center gap-2">
            <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a.5.5 0 0 1 .44.26l6.5 11A.5.5 0 0 1 14.5 13h-13a.5.5 0 0 1-.44-.74l6.5-11A.5.5 0 0 1 8 1zm0 4a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3A.5.5 0 0 0 8 5zm0 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>
            </svg>
            Overdue Tasks ({stats.overdueList.length})
          </h2>
          <div className="space-y-2">
            {stats.overdueList.map((item) => (
              <Link key={item.id} to={`/edit/${item.id}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors group"
              >
                <span className="text-sm text-slate-300 truncate group-hover:text-slate-100">{item.title}</span>
                <span className="text-xs font-mono text-red-400 flex-shrink-0 ml-3">{item.daysOverdue}d overdue</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6 flex items-center justify-center gap-3 text-emerald-400">
          <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">No overdue tasks — you're on top of everything!</span>
        </div>
      )}
    </main>
  );
}
