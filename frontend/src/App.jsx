import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute, RoleRoute } from "./components/common/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";
import { ThemeProvider } from "./context/ThemeContext";
import { AIProvider } from "./context/AIContext";

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LeadsListPage = lazy(() => import("./pages/LeadsListPage"));
const LeadDetailPage = lazy(() => import("./pages/LeadDetailPage"));
const CustomersListPage = lazy(() => import("./pages/CustomersListPage"));
const CustomerWorkspacePage = lazy(() => import("./pages/CustomerWorkspacePage"));
const TasksListPage = lazy(() => import("./pages/TasksListPage"));
const FollowUpsListPage = lazy(() => import("./pages/FollowUpsListPage"));
const PipelinePage = lazy(() => import("./pages/PipelinePage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const UsersListPage = lazy(() => import("./pages/UsersListPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const CompaniesPage = lazy(() => import("./pages/CompaniesPage"));
const QuotesPage = lazy(() => import("./pages/QuotesPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBasePage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const EmailInboxPage = lazy(() => import("./pages/EmailInboxPage"));
const WhatsAppPage = lazy(() => import("./pages/WhatsAppPage"));
const AutomationPage = lazy(() => import("./pages/AutomationPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const OnboardingWizardPage = lazy(() => import("./pages/OnboardingWizardPage"));
const DataExportPage = lazy(() => import("./pages/DataExportPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));

function PageLoading() {
    return (
        <div className="page-loading">
            <div className="spinner spinner-lg" />
        </div>
    );
}

function SuspenseWrapper({ children }) {
    return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/layout.css";
import "./styles/auth-and-pipeline.css";
import "./styles/workspace.css";
import "./styles/reports.css";
import "./styles/dashboard.css";
import "./styles/page-styles.css";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                <AIProvider>
                <ToastProvider>
                    <Routes>
                        <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
                        <Route path="/register" element={<SuspenseWrapper><RegisterPage /></SuspenseWrapper>} />

                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
                                <Route path="/profile" element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />

                                <Route path="/leads" element={<SuspenseWrapper><LeadsListPage /></SuspenseWrapper>} />
                                <Route path="/leads/:id" element={<SuspenseWrapper><LeadDetailPage /></SuspenseWrapper>} />

                                <Route path="/customers" element={<SuspenseWrapper><CustomersListPage /></SuspenseWrapper>} />
                                <Route path="/customers/:id" element={<SuspenseWrapper><CustomerWorkspacePage /></SuspenseWrapper>} />

                                <Route path="/companies" element={<SuspenseWrapper><CompaniesPage /></SuspenseWrapper>} />
                                <Route path="/quotes" element={<SuspenseWrapper><QuotesPage /></SuspenseWrapper>} />
                                <Route path="/invoices" element={<SuspenseWrapper><InvoicesPage /></SuspenseWrapper>} />

                                <Route path="/tasks" element={<SuspenseWrapper><TasksListPage /></SuspenseWrapper>} />
                                <Route path="/followups" element={<SuspenseWrapper><FollowUpsListPage /></SuspenseWrapper>} />
                                <Route path="/pipeline" element={<SuspenseWrapper><PipelinePage /></SuspenseWrapper>} />

                                <Route path="/tickets" element={<SuspenseWrapper><TicketsPage /></SuspenseWrapper>} />
                                <Route path="/knowledge-base" element={<SuspenseWrapper><KnowledgeBasePage /></SuspenseWrapper>} />
                                <Route path="/calendar" element={<SuspenseWrapper><CalendarPage /></SuspenseWrapper>} />
                                <Route path="/email" element={<SuspenseWrapper><EmailInboxPage /></SuspenseWrapper>} />
                                <Route path="/whatsapp" element={<SuspenseWrapper><WhatsAppPage /></SuspenseWrapper>} />
                                <Route path="/automation" element={<SuspenseWrapper><AutomationPage /></SuspenseWrapper>} />

                                <Route path="/reports" element={<SuspenseWrapper><ReportsPage /></SuspenseWrapper>} />
                                <Route path="/products" element={<SuspenseWrapper><ProductsPage /></SuspenseWrapper>} />
                                <Route path="/services" element={<SuspenseWrapper><ServicesPage /></SuspenseWrapper>} />
                                <Route path="/projects" element={<SuspenseWrapper><ProjectsPage /></SuspenseWrapper>} />
                                <Route path="/ai-assistant" element={<SuspenseWrapper><AIAssistantPage /></SuspenseWrapper>} />
                                <Route path="/documents" element={<SuspenseWrapper><DocumentsPage /></SuspenseWrapper>} />

                                <Route path="/pricing" element={<SuspenseWrapper><PricingPage /></SuspenseWrapper>} />
                                <Route path="/onboarding" element={<SuspenseWrapper><OnboardingWizardPage /></SuspenseWrapper>} />
                                <Route path="/data-export" element={<SuspenseWrapper><DataExportPage /></SuspenseWrapper>} />

                                <Route element={<RoleRoute roles={["admin"]} />}>
                                    <Route path="/users" element={<SuspenseWrapper><UsersListPage /></SuspenseWrapper>} />
                                    <Route path="/audit-logs" element={<SuspenseWrapper><AuditLogsPage /></SuspenseWrapper>} />
                                    <Route path="/settings" element={<SuspenseWrapper><SettingsPage /></SuspenseWrapper>} />
                                </Route>
                            </Route>
                        </Route>

                        <Route path="/404" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                </ToastProvider>
                </AIProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
