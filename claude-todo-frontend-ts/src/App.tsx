// src/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import AddTodoPage from "@/pages/AddTodoPage";
import EditTodoPage from "@/pages/EditTodoPage";
import LoginPage from "@/pages/LoginPage";
import TagsPage from "@/pages/TagsPage";
import FocusPage from "@/pages/FocusPage";
import HabitsPage from "@/pages/HabitsPage";
import StatsPage from "@/pages/StatsPage";
import { useLocalSync } from "@/hooks/useLocalSync";
import { useAuthStore } from "@/store/auth.store";
import { ThemeProvider } from "@/context/theme";

function AppShell() {
  useLocalSync();

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddTodoPage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditTodoPage /></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><TagsPage /></ProtectedRoute>} />
        <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
      </Routes>
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
