# Enterprise Refinement Plan

## Phase 1 — Reliability (crash prevention, error recovery)

### 1.1 Create ErrorBoundary component
- `src/components/ui/ErrorBoundary.jsx` — class component, renders error UI + Retry button
- **Why**: Without this, any render crash produces a white screen. #1 enterprise blocker.

### 1.2 Integrate ErrorBoundary in App.jsx
- `src/App.jsx` — wrap every lazy page in `<ErrorBoundary>` to isolate route crashes

### 1.3 Fix silent catch blocks (9 locations)
- `DashboardPage.jsx`, `ProfilePage.jsx`, `WorkflowSettingsPage.jsx`, `DashboardLayout.jsx`, `AINextBestAction.jsx`, `AIDashboardInsights.jsx`, `SmartAutomation.jsx`, `NotificationsDropdown.jsx`
- **Why**: Silent failures hide API errors from devs and users.

### 1.4 Surface errors from usePaginatedList in list pages
- All 13+ list pages that use `usePaginatedList` but never render its `error` state
- Add `<InlineError>` banner + Retry button above the table
- **Why**: Network failures currently show "No records found" instead of an error.

### 1.5 Create InlineError + InlineLoading components
- `src/components/ui/Misc.jsx` — reusable error banner and loading placeholder

## Phase 2 — Data Integrity (confirmations, loading, pagination)

### 2.1 Replace window.confirm() with ConfirmDialog (4 locations)
- `LeadDetailPage.jsx`, `CustomerDetailPage.jsx`, `UsersListPage.jsx`, `FilesTab.jsx`
- **Why**: Native confirm() blocks event loop, looks unprofessional. ConfirmDialog already exists.

### 2.2 Add confirmation to WorkflowBuilderPage delete
- `WorkflowBuilderPage.jsx` — add ConfirmDialog before `workflowsApi.remove()`
- **Why**: Deletes without any confirmation.

### 2.3 Add missing loading states (5 pages)
- `AIAssistantPage.jsx`, `DataExportPage.jsx`, `OnboardingWizardPage.jsx`, `PricingPage.jsx`, `ProfilePage.jsx`

### 2.4 Add pagination to UsersListPage
- Switch from manual `useState` to `usePaginatedList` or add `<Pagination>` component

### 2.5 Improve AuditLogsPage pagination
- Use `usePaginatedList` or proper `<Pagination>` with page numbers

## Phase 3 — Consistency & Cleanup

### 3.1 Remove dead code
- `CustomerDetailPage.jsx` (not routed)
- `CustomerFormModal.jsx` (0 bytes)

### 3.2 Consolidate chart components
- Audit Charts.jsx vs ReportsPage inline charts

### 3.3 Add .sr-only utility to base.css

## Execution Order

Phase 1 (reliability) → Phase 2 (data integrity) → Phase 3 (cleanup)

Each phase is self-contained and low-risk.
