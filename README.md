# PSM CRM — Business Operating System

A full-stack Customer Relationship Management platform with workflow automation, AI-powered insights, and a configurable drag-and-drop dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7 |
| **Backend** | Python 3.12, Flask, PyMongo |
| **Database** | MongoDB (with 60+ explicit indexes) |
| **Auth** | JWT (Flask-JWT-Extended) with RBAC (admin / manager / agent) |
| **AI** | Groq API (LLaMA 3.3 70B), fallback to placeholder responses |
| **Drag & Drop** | @hello-pangea/dnd (maintained fork of react-beautiful-dnd) |
| **Charts** | Recharts |
| **Linting** | oxlint |

---

## Quick Start

### Prerequisites
- Node.js 20+, npm
- Python 3.12+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env      # configure your environment
python run.py             # serves on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # serves on http://localhost:5173
npm run build             # production build → dist/
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017/psm_crm` | MongoDB connection string |
| `SECRET_KEY` | `dev-secret-key` | Flask secret |
| `JWT_SECRET_KEY` | `dev-jwt-secret-key` | JWT signing key |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | `60` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRES_DAYS` | `30` | Refresh token TTL |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |
| `GROQ_API_KEY` | — | Groq API key for AI features |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |
| `VITE_API_BASE_URL` (frontend) | `http://localhost:5000/api` | Backend API URL |
| `VITE_AI_PROVIDER` (frontend) | `groq` | AI provider selection |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (React SPA)            │
│  Vite dev server :5173  │  Build → dist/     │
│                                               │
│  AuthContext → axios client → JWT in headers  │
│  AIProvider  → dynamic provider (groq/etc)    │
│  ThemeContext → CSS custom properties         │
│  ToastContext → notification stack            │
│  WorkspaceContext → customer workspace        │
└─────────────────────┬───────────────────────┘
                      │ HTTP (JSON)
                      ▼
┌─────────────────────────────────────────────┐
│              Backend (Flask API)              │
│  Gunicorn/Dev :5000   │  JSON envelope         │
│                                               │
│  Routes → Services → MongoDB (PyMongo)       │
│  JWT middleware → RBAC decorators            │
│  31 blueprints → 36 route files              │
│  33 service files → business logic           │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │    MongoDB     │
              │  (psm_crm)     │
              │  30+ collec.  │
              └───────────────┘
```

### API Response Envelope

All endpoints return a consistent JSON structure:

```json
// Success (200)
{ "success": true, "message": "Success", "data": { ... }, "meta": { "page": 1, "per_page": 20, "total": 42 } }

// Error (4xx/5xx)
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Required" }] }
```

---

## Backend (`backend/`)

### Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask factory, registers 31 blueprints
│   ├── config.py            # Dev/Prod/Test config classes
│   ├── db.py                # MongoDB connection + 60+ indexes
│   ├── extensions.py        # JWTManager, CORS, MongoClient stubs
│   ├── models/              # 21 Marshmallow schema files
│   ├── routes/              # 36 route/blueprint files
│   ├── services/            # 33 business-logic service files
│   ├── middlewares/         # JWT callbacks, auth decorators
│   └── utils/               # responses, errors, pagination, helpers
├── run.py                   # Entrypoint
├── requirements.txt
└── .env
```

### MongoDB Collections

| Collection | Key Indexes | Purpose |
|---|---|---|
| `users` | email (unique), role, status | User accounts |
| `roles` | name (unique), organization_id | RBAC roles |
| `token_blocklist` | jti (unique), TTL expiry | JWT logout/refresh |
| `leads` | email, phone, status, source, assigned_to, text search | Lead management |
| `customers` | email (unique), phone, status, assigned_to, text search | Customer records |
| `followups` | related_to, assigned_to, status, due_date | Follow-up tracking |
| `tasks` | assigned_to, status, priority, due_date, related_to | Task management |
| `activities` | related_to, created_by, created_at, type | Activity timeline |
| `pipeline_stages` | order | Sales pipeline stages |
| `deals` | stage_id, customer_id, assigned_to, status | Deals/opportunities |
| `notifications` | user_id, is_read, created_at | User notifications |
| `settings` | key (unique), scope+scope_id | App settings |
| `audit_logs` | user_id, entity_type, entity_id | Audit trail |
| `companies` | name (unique), domain, industry | Company records |
| `quotes` | customer_id, status, assigned_to | Sales quotes |
| `invoices` | customer_id, status, invoice_number (unique) | Invoicing |
| `payments` | invoice_id, transaction_id | Payment records |
| `tickets` | customer_id, status, priority, assigned_to | Support tickets |
| `kb_articles` | title, status, category, text search | Knowledge base |
| `meetings` | customer_id, lead_id, assigned_to, start_time | Calendar events |
| `emails` | customer_id, lead_id, direction | Email communications |
| `email_templates` | name | Email templates |
| `whatsapp_messages` | customer_id, lead_id, direction | WhatsApp messages |
| `automations` | status, object_type, trigger.type | Business automations |
| `workflows` | status, category, entity_type, text search | Workflow definitions |
| `workflow_templates` | category, entity_type, industry | Template library |
| `workflow_executions` | workflow_id, status, entity, trigger | Execution history |
| `organizations` | user_id, business_type | Organization setup |
| `branches` | organization_id | Multi-branch orgs |
| `departments` | organization_id, name | Department structure |
| `dashboards` | organization_id | Saved dashboard configs |
| `forms` | organization_id | Custom forms |
| `permissions` | organization_id, role | Granular permissions |

### API Blueprints

| Blueprint | Prefix | Key Endpoints |
|---|---|---|
| `health_bp` | `/api/health` | Health check |
| `auth_bp` | `/api/auth` | login, register, refresh, logout, me |
| `users_bp` | `/api/users` | CRUD users, roles, permissions |
| `leads_bp` | `/api/leads` | CRUD leads, bulk, convert, import |
| `customers_bp` | `/api/customers` | CRUD customers, activity timeline |
| `followups_bp` | `/api/followups` | CRUD follow-ups |
| `tasks_bp` | `/api/tasks` | CRUD tasks, status transitions |
| `pipeline_bp` | `/api/pipeline` | Pipeline stages, order |
| `deals_bp` | `/api/deals` | CRUD deals, stage moves |
| `dashboard_bp` | `/api/dashboard` | Dashboard summary, KPI data |
| `reports_bp` | `/api/reports` | Reports, analytics data |
| `search_bp` | `/api/search` | Global search across entities |
| `notifications_bp` | `/api/notifications` | List, mark read, mark all read |
| `settings_bp` | `/api/settings` | Get/upsert settings |
| `audit_bp` | `/api/audit-logs` | Query audit trail |
| `activities_bp` | `/api/activities` | Recent activities, timeline |
| `companies_bp` | `/api/companies` | CRUD companies |
| `quotes_bp` | `/api/quotes` | CRUD quotes, line items |
| `invoices_bp` | `/api/invoices` | CRUD invoices, payments |
| `tickets_bp` | `/api/tickets` | CRUD support tickets |
| `kb_bp` | `/api/knowledge-base` | CRUD knowledge articles |
| `email_bp` | `/api/email` | Email sync, templates |
| `whatsapp_bp` | `/api/whatsapp` | WhatsApp messaging |
| `calendar_bp` | `/api/calendar` | Meetings, events |
| `automation_bp` | `/api/automation` | Automation rules |
| `bulk_bp` | `/api/bulk` | Bulk actions (delete, update) |
| `export_bp` | `/api/data-export` | CSV/JSON export |
| `enrich_bp` | `/api/enrichment` | Data enrichment |
| `pricing_bp` | `/api/pricing` | Pricing plans |
| `onboarding_bp` | `/api/onboarding` | Onboarding wizard |
| `workflows_bp` | `/api/workflows` | CRUD workflows, activate/deactivate |
| `workflow_templates_bp` | `/api/workflow-templates` | Template CRUD, seed, apply |
| `workflow_executions_bp` | `/api/workflow-executions` | Execution history, stats |
| `workflow_analytics_bp` | `/api/workflow-analytics` | Aggregated metrics |
| `setup_wizard_bp` | `/api/setup-wizard` | Business setup AI wizard |
| `employee_setup_bp` | `/api/employee-setup` | Employee onboarding |
| `ai_bp` | `/api/ai` | AI chat, analyze, generate |

### Key Services

| Service | Purpose |
|---|---|
| `workflow_execution_engine.py` | Production-grade background engine with ThreadPoolExecutor, retry with exponential backoff, compensation rollback |
| `organization_generator.py` | AI-powered organization structure generation from business description |
| `business_template_service.py` | Pre-built templates for 14+ industries (construction, healthcare, retail, SaaS, etc.) |
| `ai_business_analyzer.py` | Keyword-based business type detection |
| `permission_engine.py` | Dynamic RBAC based on role level (1–5) |
| `smart_field.py` | Smart field suggestions / auto-complete |
| `next_best_action.py` | AI-powered next-best-action recommendations |

---

## Frontend (`frontend/`)

### Structure

```
frontend/src/
├── api/                  # 25 API client modules (axios)
│   ├── client.js         # Axios instance + JWT interceptor + auto-refresh
│   ├── authApi.js
│   ├── leadsApi.js
│   ├── customersApi.js
│   ├── pipelineApi.js
│   ├── workflowsApi.js
│   ├── miscApi.js
│   └── ... (25 total)
├── components/
│   ├── layout/           # AppLayout, Sidebar, NotificationsDropdown, GlobalSearch
│   ├── common/           # RouteGuards (ProtectedRoute, RoleRoute), CommandPalette
│   ├── ui/               # Avatar, Badge, Button, Charts, ConfirmDialog, DataTable, FormFields, Icons(70+), Modal, SlideOverPanel
│   ├── features/         # ActivityTimeline, KanbanBoard, FormModals, WorkspaceHeader, workspace/ (7 tabs)
│   ├── dashboard/        # DashboardLayout (draggable), DashboardWidget
│   ├── ai/               # AIDashboardInsights, AINextBestAction, AIReportBuilder, PredictiveAnalytics, SmartAutomation
│   ├── business/         # AIBusinessAdvisor, BusinessHealthScore, RevenueForecast, SmartNotifications, TodayActionCenter
│   └── workflow/         # WorkflowCanvas, WorkflowNode, WorkflowNodeConfig, WorkflowNodePalette, WorkflowToolbar, WorkflowSetupWizard, WorkflowExecutionLog
├── context/              # AuthContext, ThemeContext, AIContext, ToastContext, WorkspaceContext
├── hooks/                # usePaginatedList, useWorkspace, useDebounce, useInlineEdit, useKeyboardShortcuts, useTabLoad
├── pages/                # 42 lazy-loaded page components
├── services/             # AI providers (openai/gemini/ollama/groq), keyboard shortcuts, notifications, search, workflow engine
├── styles/               # 10 CSS files (tokens, base, components, layout, dashboard, reports, workflow, page-styles, auth, workspace)
└── utils/                # formatters.js, errorUtils.js
```

### Routing

All 42 pages are lazy-loaded with `React.lazy()` + `Suspense`.

```
/                              → DashboardPage           (protected)
/profile                       → ProfilePage
/leads                         → LeadsListPage
/leads/:id                     → LeadDetailPage
/customers                     → CustomersListPage
/customers/:id                 → CustomerWorkspacePage
/companies                     → CompaniesPage
/quotes                        → QuotesPage
/invoices                      → InvoicesPage
/tasks                         → TasksListPage
/followups                     → FollowUpsListPage
/pipeline                      → PipelinePage
/tickets                       → TicketsPage
/knowledge-base                → KnowledgeBasePage
/calendar                      → CalendarPage
/email                         → EmailInboxPage
/whatsapp                      → WhatsAppPage
/automation                    → AutomationPage
/reports                       → ReportsPage
/products                      → ProductsPage
/services                      → ServicesPage
/projects                      → ProjectsPage
/ai-assistant                  → AIAssistantPage
/documents                     → DocumentsPage
/workflows                     → WorkflowDashboardPage
/workflows/builder             → WorkflowBuilderPage
/workflows/templates           → WorkflowTemplatesPage
/workflows/executions          → WorkflowExecutionsPage
/workflows/analytics           → WorkflowAnalyticsPage
/workflows/settings            → WorkflowSettingsPage (admin)
/pricing                       → PricingPage
/onboarding                    → OnboardingWizardPage
/setup-wizard                  → BusinessSetupWizardPage
/data-export                   → DataExportPage
/users                         → UsersListPage (admin)
/audit-logs                    → AuditLogsPage (admin)
/settings                      → SettingsPage (admin)
/login                         → LoginPage (public)
/register                      → RegisterPage (public)
/404                           → NotFoundPage
```

### Auth Flow

```
Login → POST /api/auth/login → {user, access_token, refresh_token}
  → tokens stored in localStorage (psm_access_token, psm_refresh_token)
  → user state set in AuthContext
  → axios interceptor attaches Bearer token to every request

On 401 → auto-refresh via POST /api/auth/refresh
  → on failure: clear tokens, dispatch psm:session-expired event
  → AuthContext listens, redirects to /login

ProtectedRoute checks:
  1. has psm_access_token? → show page or loading
  2. no token → redirect to /login with return URL

RoleRoute checks user.role against allowed roles:
  admin → full access
  manager → no admin-only routes
  agent → no admin-only routes
```

### Navigation Sidebar

| Section | Items |
|---|---|
| **Workspace** | Dashboard, Leads, Customers, Companies, Pipeline |
| **Catalog** | Products, Services |
| **Sales** | Quotes, Invoices |
| **Activity** | Tasks, Follow-ups, Calendar, Projects |
| **Communications** | Email, WhatsApp |
| **Support** | Tickets, Knowledge Base |
| **Insights** | Reports, AI Assistant, Documents |
| **Workflow** | Dashboard, Builder, Templates, Automation, Executions, Analytics, Settings (admin) |
| **Admin** | Users, Audit Logs, Settings, Data Export (all admin) |

### Design Tokens

The design system uses CSS custom properties defined in `tokens.css`:

- **Ink Scale**: 950 (darkest) → 100 (lightest), inverted in dark mode
- **Accent**: 8 color options (purple default), HSL-based for glow effects
- **Surfaces**: canvas, surface, surface-sunken, surface-raised
- **Borders**: border-light, border, border-strong
- **Shadows**: xs through xl, glow
- **Radii**: xs (4px) → full (9999px)
- **Typography**: Inter font family (display + body), JetBrains Mono for code
- **Dark Mode**: `:root[data-theme="dark"]` overrides all color tokens

### AI Provider Architecture

The frontend supports pluggable AI providers:

```
services/ai/
├── index.js              # Dynamic loader: selects provider from VITE_AI_PROVIDER env
├── providers/
│   ├── openai.js         # OpenAI-compatible API
│   ├── gemini.js         # Google Gemini API
│   ├── ollama.js         # Local Ollama API
│   └── groq.js           # Groq API (default)
```

The `AIContext.jsx` wraps provider-agnostic methods: `ask()`, `analyze()`, `generate()`. If no API key is configured, it returns placeholder/local responses.

### Workflow Builder

The visual workflow builder supports:

- **Node types**: Start, End, Condition, Approval, Wait, Assign Owner, Transfer Owner, Notification, Email, WhatsApp, SMS, Create Task, Update Record, Generate Document, Webhook, REST API, AI Decision, Merge, Parallel
- **Canvas**: Zoom (Ctrl+scroll, 0.3–2.5x), pan (scroll / middle-click), grid coordinate system
- **Edges**: Bezier-curve connections via output handle click, SVG rendering with arrow markers
- **Config panel**: Per-node-type field definitions (select, multiselect, boolean, number, textarea)
- **Toolbar**: Save, Activate, Deactivate, Duplicate, Delete, Run
- **Validation**: Must have Start + End nodes, all nodes connected, no orphans
- **Keyboard shortcuts**: Ctrl+S (save), Delete/Backspace (delete selected), Escape (cancel/deselect)

### Dashboard Widgets

The draggable dashboard layout supports 8 widgets:

| Widget | Span | Description |
|---|---|---|
| Business Health | 1 | Multi-ring gauge with score (0-100) |
| Action Center | 1 | Overdue tasks, follow-ups, new leads, open deals |
| AI Advisor | 1 | Collapsible insights + "Ask AI" input |
| Revenue Forecast | 2 | 6-month bar chart with trend indicator |
| Notifications | 1 | Priority-sorted notification list |
| Pipeline by Stage | 2 | Stage distribution bar chart |
| Win Rate | 1 | Progress ring + won/open/lost breakdown |
| Recent Activity | 2 | Activity feed from across the CRM |

---

## CI / Linting

```bash
cd frontend
npm run lint       # oxlint
npm run build      # vite build → verifies compilation
```

---

## Project File Inventory

### Counts

| Category | Count |
|---|---|
| Frontend API modules | 25 |
| Frontend page components | 42 |
| Frontend UI components | ~15 |
| Frontend business/feature components | ~20 |
| Frontend CSS files | 10 |
| Backend route blueprints | 36 |
| Backend service modules | 33 |
| Backend model schemas | 21 |
| MongoDB indexes | 60+ |
| MongoDB collections | 30+ |
