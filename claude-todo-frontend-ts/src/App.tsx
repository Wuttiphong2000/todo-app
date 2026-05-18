// src/App.tsx
import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import GuestBanner from "@/components/GuestBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import ShortcutsDialog from "@/components/ShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import HomePage from "@/pages/HomePage";
import AddTodoPage from "@/pages/AddTodoPage";
import EditTodoPage from "@/pages/EditTodoPage";
import LoginPage from "@/pages/LoginPage";
import TagsPage from "@/pages/TagsPage";
import FocusPage from "@/pages/FocusPage";
import HabitsPage from "@/pages/HabitsPage";
import CalendarPage from "@/pages/CalendarPage";
import StatsPage from "@/pages/StatsPage";
import { useLocalSync } from "@/hooks/useLocalSync";
import { useAuthStore } from "@/store/auth.store";
import { ThemeProvider } from "@/context/theme";

function AppShell() {
  useLocalSync();
  const isGuest = useAuthStore((s) => s.isGuest);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const handleOpenShortcuts = useCallback(() => setShowShortcuts(true), []);
  useKeyboardShortcuts({ onOpenShortcuts: handleOpenShortcuts });

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      {isGuest && <GuestBanner />}
      <Routes>
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddTodoPage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditTodoPage /></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><TagsPage /></ProtectedRoute>} />
        <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
      </Routes>
      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
