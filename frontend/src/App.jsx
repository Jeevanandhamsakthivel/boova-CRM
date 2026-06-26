import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute, RoleRoute } from "./components/common/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LeadsListPage from "./pages/LeadsListPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import CustomersListPage from "./pages/CustomersListPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import TasksListPage from "./pages/TasksListPage";
import FollowUpsListPage from "./pages/FollowUpsListPage";
import PipelinePage from "./pages/PipelinePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import UsersListPage from "./pages/UsersListPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/layout.css";
import "./styles/auth-and-pipeline.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                <Route path="/leads" element={<LeadsListPage />} />
                <Route path="/leads/:id" element={<LeadDetailPage />} />

                <Route path="/customers" element={<CustomersListPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />

                <Route path="/tasks" element={<TasksListPage />} />
                <Route path="/followups" element={<FollowUpsListPage />} />
                <Route path="/pipeline" element={<PipelinePage />} />
                <Route path="/reports" element={<ReportsPage />} />

                <Route element={<RoleRoute roles={["admin"]} />}>
                  <Route path="/users" element={<UsersListPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
