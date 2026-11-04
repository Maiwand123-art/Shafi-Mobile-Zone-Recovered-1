import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute({ children, admin = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-state">Loading secure session…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace/>;
  if (admin && !isAdmin) return <Navigate to="/account" replace/>;
  return children;
}
