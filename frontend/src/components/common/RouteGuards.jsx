import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageLoading } from "../ui/Misc";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading />;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/access-denied" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
