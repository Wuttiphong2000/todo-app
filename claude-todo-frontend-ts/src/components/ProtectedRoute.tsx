// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  if (!token && !isGuest) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
