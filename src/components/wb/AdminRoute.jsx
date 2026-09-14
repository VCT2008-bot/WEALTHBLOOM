import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

// Guards admin routes. Admin and Super Admin may enter; Super Admin-only pages
// pass requiredRole="super_admin". Role is enforced server-side in every backend function too.
export default function AdminRoute({ children, requiredRole }) {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  if (isLoadingAuth || !authChecked) {
    return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role || user?.data?.role;
  const allowed = role === "admin" || role === "super_admin";
  if (!allowed) return <Navigate to="/dashboard" replace />;
  if (requiredRole === "super_admin" && role !== "super_admin") return <Navigate to="/admin" replace />;
  return children;
}