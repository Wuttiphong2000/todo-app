// src/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import AddTodoPage from "@/pages/AddTodoPage";
import EditTodoPage from "@/pages/EditTodoPage";
import LoginPage from "@/pages/LoginPage";
import { useLocalSync } from "@/hooks/useLocalSync";
import { useAuthStore } from "@/store/auth.store";

function AppShell() {
  useLocalSync();

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddTodoPage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditTodoPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}
