// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";
import AddTodoPage from "@/pages/AddTodoPage";
import EditTodoPage from "@/pages/EditTodoPage";
import { useLocalSync } from "@/hooks/useLocalSync";

function AppShell() {
  useLocalSync(); // Bootstrap: load from localStorage + fetch API

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <Routes>
        <Route path="/"        element={<HomePage />} />
        <Route path="/add"     element={<AddTodoPage />} />
        <Route path="/edit/:id" element={<EditTodoPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppShell />
    </BrowserRouter>
  );
}