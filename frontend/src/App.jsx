import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute, RoleRoute } from "./components/common/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";
import { ThemeProvider } from "./context/ThemeContext";
import { AIProvider } from "./context/AIContext";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

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
const BusinessSetupWizardPage = lazy(() => import("./pages/BusinessSetupWizardPage"));
const DataExportPage = lazy(() => import("./pages/DataExportPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const WorkflowDashboardPage = lazy(() => import("./pages/WorkflowDashboardPage"));
const WorkflowBuilderPage = lazy(() => import("./pages/WorkflowBuilderPage"));
const WorkflowTemplatesPage = lazy(() => import("./pages/WorkflowTemplatesPage"));
const WorkflowExecutionsPage = lazy(() => import("./pages/WorkflowExecutionsPage"));
const WorkflowAnalyticsPage = lazy(() => import("./pages/WorkflowAnalyticsPage"));
const WorkflowSettingsPage = lazy(() => import("./pages/WorkflowSettingsPage"));

function PageLoading() {
    return (
        <div className="page-loading">
            <div className="spinner spinner-lg" />
        </div>
    );
}

function SafePage({ children }) {
    return (
        <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </ErrorBoundary>
    );
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
import "./styles/workflow.css";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <AIProvider>
                        <ToastProvider>
                            <Routes>
                                <Route path="/login" element={<SafePage><LoginPage /></SafePage>} />
                                <Route path="/register" element={<SafePage><RegisterPage /></SafePage>} />

                                <Route element={<ProtectedRoute />}>
                                    <Route element={<AppLayout />}>
                                        <Route path="/" element={<SafePage><DashboardPage /></SafePage>} />
                                        <Route path="/profile" element={<SafePage><ProfilePage /></SafePage>} />

                                        <Route path="/leads" element={<SafePage><LeadsListPage /></SafePage>} />
                                        <Route path="/leads/:id" element={<SafePage><LeadDetailPage /></SafePage>} />

                                        <Route path="/customers" element={<SafePage><CustomersListPage /></SafePage>} />
                                        <Route path="/customers/:id" element={<SafePage><CustomerWorkspacePage /></SafePage>} />

                                        <Route path="/companies" element={<SafePage><CompaniesPage /></SafePage>} />
                                        <Route path="/quotes" element={<SafePage><QuotesPage /></SafePage>} />
                                        <Route path="/invoices" element={<SafePage><InvoicesPage /></SafePage>} />

                                        <Route path="/tasks" element={<SafePage><TasksListPage /></SafePage>} />
                                        <Route path="/followups" element={<SafePage><FollowUpsListPage /></SafePage>} />
                                        <Route path="/pipeline" element={<SafePage><PipelinePage /></SafePage>} />

                                        <Route path="/tickets" element={<SafePage><TicketsPage /></SafePage>} />
                                        <Route path="/knowledge-base" element={<SafePage><KnowledgeBasePage /></SafePage>} />
                                        <Route path="/calendar" element={<SafePage><CalendarPage /></SafePage>} />
                                        <Route path="/email" element={<SafePage><EmailInboxPage /></SafePage>} />
                                        <Route path="/whatsapp" element={<SafePage><WhatsAppPage /></SafePage>} />
                                        <Route path="/automation" element={<SafePage><AutomationPage /></SafePage>} />

                                        <Route path="/reports" element={<SafePage><ReportsPage /></SafePage>} />
                                        <Route path="/products" element={<SafePage><ProductsPage /></SafePage>} />
                                        <Route path="/services" element={<SafePage><ServicesPage /></SafePage>} />
                                        <Route path="/projects" element={<SafePage><ProjectsPage /></SafePage>} />
                                        <Route path="/ai-assistant" element={<SafePage><AIAssistantPage /></SafePage>} />
                                        <Route path="/documents" element={<SafePage><DocumentsPage /></SafePage>} />

                                        <Route path="/workflows" element={<SafePage><WorkflowDashboardPage /></SafePage>} />
                                        <Route path="/workflows/builder" element={<SafePage><WorkflowBuilderPage /></SafePage>} />
                                        <Route path="/workflows/templates" element={<SafePage><WorkflowTemplatesPage /></SafePage>} />
                                        <Route path="/workflows/executions" element={<SafePage><WorkflowExecutionsPage /></SafePage>} />
                                        <Route path="/workflows/analytics" element={<SafePage><WorkflowAnalyticsPage /></SafePage>} />
                                        <Route element={<RoleRoute roles={["admin"]} />}>
                                            <Route path="/workflows/settings" element={<SafePage><WorkflowSettingsPage /></SafePage>} />
                                        </Route>

                                        <Route path="/pricing" element={<SafePage><PricingPage /></SafePage>} />
                                        <Route path="/onboarding" element={<SafePage><OnboardingWizardPage /></SafePage>} />
                                        <Route path="/setup-wizard" element={<SafePage><BusinessSetupWizardPage /></SafePage>} />
                                        <Route path="/data-export" element={<SafePage><DataExportPage /></SafePage>} />

                                        <Route element={<RoleRoute roles={["admin"]} />}>
                                            <Route path="/users" element={<SafePage><UsersListPage /></SafePage>} />
                                            <Route path="/audit-logs" element={<SafePage><AuditLogsPage /></SafePage>} />
                                            <Route path="/settings" element={<SafePage><SettingsPage /></SafePage>} />
                                        </Route>
                                    </Route>
                                </Route>

                                <Route path="/404" element={<SafePage><NotFoundPage /></SafePage>} />
                                <Route path="*" element={<Navigate to="/404" replace />} />
                            </Routes>
                        </ToastProvider>
                    </AIProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
