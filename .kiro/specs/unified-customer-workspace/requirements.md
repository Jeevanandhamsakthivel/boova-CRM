# Requirements Document

## Introduction

The Unified Customer Workspace replaces the existing `CustomerDetailPage` with a single, comprehensive screen that gives users a complete picture of any customer without navigating away. All related data — timeline, tasks, deals, follow-ups, notes, files, and customer-level analytics — is accessible within one two-panel layout. This is a core differentiator for PSM CRM against Salesforce, Zoho, and HubSpot, which spread this information across multiple disconnected screens.

The workspace must reduce context switching to zero for the most common daily workflows: reviewing recent interactions, logging a note, creating a task, checking deal status, and scheduling a follow-up.

---

## Glossary

- **Workspace**: The Unified Customer Workspace page rendered at `/customers/:id`.
- **Customer**: A record in the `customers` collection, converted from a lead or created directly.
- **Timeline**: The chronological activity feed for a customer, sourced from the `activities` collection via `activity_service`.
- **Note**: A free-text, time-stamped entry attached to a customer record, stored as an activity of type `note`.
- **Quick_Action**: A button or keyboard shortcut that opens an inline form without navigating away from the Workspace.
- **Tab**: One of the secondary content panels within the Workspace (Tasks, Deals, Follow-ups, Notes, Files, Analytics).
- **Header_Panel**: The top section of the Workspace showing identity, key stats, and Quick Actions.
- **Activity_Service**: The backend `activity_service` and `audit_service.record_activity` that writes and reads all timeline entries.
- **Workspace_API**: A new backend endpoint `/api/customers/:id/workspace` that returns all Workspace data in a single response.
- **Files**: Uploaded file attachments associated with a customer, stored via the files collection.
- **Analytics_Panel**: The tab showing customer-level metrics derived from existing deals, tasks, and follow-up data.

---

## Requirements

### Requirement 1: Workspace Layout and Navigation

**User Story:** As a sales rep, I want a single page that shows everything about a customer, so that I never have to leave that page to understand a customer's full context.

#### Acceptance Criteria

1. THE Workspace SHALL render at the existing route `/customers/:id`, replacing the current `CustomerDetailPage`.
2. THE Workspace SHALL display a persistent Header_Panel containing the customer's name, company, email, phone, status badge, assigned owner, and lifetime value.
3. THE Workspace SHALL display a tab bar with the following tabs in order: Timeline, Tasks, Deals, Follow-ups, Notes, Files, Analytics.
4. WHEN a user navigates to the Workspace, THE Workspace SHALL default to the Timeline tab.
5. THE Workspace SHALL maintain the selected tab in the URL hash (e.g. `#tasks`) so that browser back/forward navigation and shared links restore the correct tab.
6. THE Workspace SHALL render completely within two navigation levels: the top-level sidebar and the Workspace itself — no nested sub-pages.
7. WHEN the Workspace is loading data, THE Workspace SHALL display a skeleton loading state for each panel rather than a full-page spinner.

---

### Requirement 2: Single-Request Workspace Data Loading

**User Story:** As a sales rep, I want the workspace to load fast, so that I can start working within seconds of opening a customer record.

#### Acceptance Criteria

1. THE Workspace_API SHALL provide a single `GET /api/customers/:id/workspace` endpoint that returns the customer record, the 20 most recent timeline activities, open tasks count, active deals count, pending follow-ups count, and total lifetime value in one response.
2. WHEN the Workspace page mounts, THE Workspace SHALL fetch data from `Workspace_API` in a single HTTP request before rendering content.
3. THE Workspace_API SHALL respond within 500ms for customers with fewer than 10,000 associated activity records.
4. WHEN a tab is selected for the first time, THE Workspace SHALL lazy-load that tab's full dataset using the existing per-resource API endpoints.
5. IF the `Workspace_API` request fails, THEN THE Workspace SHALL display an error state with a retry button, without crashing the page.

---

### Requirement 3: Persistent Header Panel with Inline Editing

**User Story:** As a sales rep, I want to see and edit key customer fields at a glance, so that I can update information without opening a separate edit form.

#### Acceptance Criteria

1. THE Header_Panel SHALL display: customer name, company, email, phone, status, assigned owner, tags, and lifetime value at all times regardless of the active tab.
2. WHEN a user clicks any editable field in the Header_Panel, THE Header_Panel SHALL switch that field to an inline edit input without opening a modal.
3. WHEN a user confirms an inline edit by pressing Enter or clicking away, THE Workspace SHALL call `PATCH /api/customers/:id` and update the field without a full page reload.
4. IF the inline edit save fails, THEN THE Header_Panel SHALL display an inline error message adjacent to the field and restore the previous value.
5. THE Header_Panel SHALL display a Quick_Action bar containing: "Add Note", "Create Task", "Add Deal", "Schedule Follow-up" buttons.
6. WHEN a Quick_Action button is activated, THE Workspace SHALL open an inline slide-over panel anchored to the right side of the screen without navigating away.

---

### Requirement 4: Activity Timeline Tab

**User Story:** As a sales rep, I want a chronological feed of every interaction with a customer, so that I can understand the full relationship history at a glance.

#### Acceptance Criteria

1. THE Timeline tab SHALL display all activity entries for the customer sorted by `created_at` descending, sourced from `Activity_Service`.
2. THE Timeline tab SHALL display each activity entry with: activity type icon, description, actor name, and relative timestamp (e.g. "2 hours ago").
3. THE Timeline tab SHALL support infinite scroll, loading 20 additional entries per page when the user scrolls to the bottom.
4. THE Timeline tab SHALL render activity types including at minimum: `created`, `note`, `task_created`, `task_status_change`, `deal_created`, `deal_moved`, `followup_scheduled`, `followup_completed`.
5. WHEN a user adds a note via the "Add Note" Quick_Action, THE Timeline tab SHALL prepend the new note to the feed immediately after the API confirms creation, without requiring a manual refresh.
6. THE Timeline tab SHALL provide a filter control that lets the user show only a selected activity type, with the default showing all types.

---

### Requirement 5: Notes

**User Story:** As a sales rep, I want to log free-text notes directly on the customer record, so that I can capture meeting outcomes and call summaries without switching to another tool.

#### Acceptance Criteria

1. THE Workspace SHALL store notes as activity records with type `note`, using the existing `Activity_Service` — no separate notes collection is required.
2. WHEN a user submits a note via the "Add Note" Quick_Action, THE Activity_Service SHALL create an activity record with `type: "note"`, the note body in `description`, the customer ID in `related_to`, and the authenticated user as `created_by`.
3. THE Notes tab SHALL list all activities with `type: "note"` for the customer, sorted by `created_at` descending.
4. WHEN a note is displayed, THE Notes tab SHALL show the full text, author, and absolute timestamp.
5. WHEN a user clicks a note, THE Notes tab SHALL allow inline editing of the note body.
6. WHEN a note edit is saved, THE Activity_Service SHALL update the activity record and record the edit action in the audit log.
7. IF a note body is empty when submitted, THEN THE Workspace SHALL reject the submission and display a validation message without calling the API.

---

### Requirement 6: Tasks Tab

**User Story:** As a sales rep, I want to view and manage tasks linked to a customer from the customer record, so that I never lose track of next actions.

#### Acceptance Criteria

1. THE Tasks tab SHALL display all tasks where `related_to.type == "customer"` and `related_to.id == customer._id`, sourced from the existing tasks API.
2. THE Tasks tab SHALL display each task with: title, status badge, priority badge, due date, and assigned owner.
3. THE Tasks tab SHALL group tasks into two sections: open tasks (status in `["todo", "in_progress"]`) and completed tasks (status in `["completed", "cancelled"]`), with completed tasks collapsed by default.
4. WHEN a user clicks the status badge on a task, THE Tasks tab SHALL cycle the task status and call `PATCH /api/tasks/:id` inline without opening a modal.
5. WHEN a user activates the "Create Task" Quick_Action, THE Workspace SHALL pre-populate the task form with `related_to_type: "customer"` and `related_to_id` set to the current customer's ID.
6. WHEN a task is created or updated within the Workspace, THE Timeline tab SHALL reflect the new activity entry on next view.
7. THE Tasks tab SHALL display a count badge on the tab label showing the number of open tasks.

---

### Requirement 7: Deals Tab

**User Story:** As a sales rep, I want to see all deals associated with a customer from the customer record, so that I can track revenue opportunities without switching to the pipeline view.

#### Acceptance Criteria

1. THE Deals tab SHALL display all deals where `customer_id == customer._id`, sourced from the existing deals API filtered by `customer_id`.
2. THE Deals tab SHALL display each deal with: title, stage name, value, status badge, assigned owner, and expected close date.
3. THE Deals tab SHALL sort deals with open deals first, then won, then lost.
4. WHEN a user activates the "Add Deal" Quick_Action, THE Workspace SHALL pre-populate the deal form with `customer_id` set to the current customer's ID.
5. THE Deals tab SHALL display a summary row showing: total open deal value, total won deal value, and count of deals per status.
6. WHEN a user clicks a deal title, THE Workspace SHALL navigate to the existing deal detail view (preserving existing deal navigation behavior).
7. THE Deals tab SHALL display a count badge on the tab label showing the number of open deals.

---

### Requirement 8: Follow-ups Tab

**User Story:** As a sales rep, I want to view and create follow-ups for a customer from within the customer record, so that I can schedule next steps without leaving the workspace.

#### Acceptance Criteria

1. THE Follow-ups tab SHALL display all follow-ups where `related_to.type == "customer"` and `related_to.id == customer._id`, sourced from the existing follow-ups API.
2. THE Follow-ups tab SHALL display each follow-up with: title, type icon, due date, status badge, and assigned owner.
3. THE Follow-ups tab SHALL sort follow-ups with pending and overdue items first, sorted by `due_date` ascending.
4. WHEN a follow-up `due_date` is earlier than the current time and the status is `pending`, THE Follow-ups tab SHALL render that follow-up with a visual overdue indicator.
5. WHEN a user activates the "Schedule Follow-up" Quick_Action, THE Workspace SHALL pre-populate the follow-up form with `related_to_type: "customer"` and `related_to_id` set to the current customer's ID.
6. WHEN a user marks a follow-up as completed inline, THE Workspace SHALL call `PATCH /api/followups/:id` with `status: "completed"` and update the display without a full page reload.
7. THE Follow-ups tab SHALL display a count badge on the tab label showing the number of pending follow-ups.

---

### Requirement 9: Files Tab

**User Story:** As a sales rep, I want to attach and retrieve files from the customer record, so that I can keep contracts, proposals, and documents in one place without using a separate file storage tool.

#### Acceptance Criteria

1. THE Files tab SHALL display all files associated with the customer, showing: filename, file type icon, file size, upload date, and uploader name.
2. WHEN a user clicks "Upload File", THE Files tab SHALL open a file picker accepting PDF, DOCX, XLSX, PNG, JPG, and CSV formats up to 25 MB per file.
3. WHEN a file is successfully uploaded, THE Files tab SHALL display the new file immediately in the list and record a `file_uploaded` activity via Activity_Service.
4. IF a file exceeds 25 MB, THEN THE Files tab SHALL reject the upload before sending it to the server and display a validation error to the user.
5. IF a file type is not in the accepted list, THEN THE Files tab SHALL reject the upload and display a message listing the supported formats.
6. WHEN a user clicks a file, THE Files tab SHALL open the file in a new browser tab for preview or download.
7. WHEN a user deletes a file, THE Files tab SHALL request confirmation, call the delete API, remove the file from the list, and record a `file_deleted` activity via Activity_Service.

---

### Requirement 10: Analytics Panel

**User Story:** As a sales manager, I want a summary of customer engagement metrics on the customer record, so that I can assess account health without running a separate report.

#### Acceptance Criteria

1. THE Analytics_Panel SHALL display the following metrics computed from existing data: total lifetime value, count of won deals, count of lost deals, count of open deals, average deal value (won), total tasks completed, total follow-ups completed, and days since last activity.
2. THE Analytics_Panel SHALL compute all metrics from data already available through the existing deals, tasks, follow-ups, and activities APIs — no new backend aggregation service is required at this stage.
3. WHEN the Analytics tab is selected for the first time, THE Analytics_Panel SHALL fetch required data from existing APIs and compute metrics client-side.
4. THE Analytics_Panel SHALL display a "Last Activity" indicator showing the description and timestamp of the most recent timeline entry.
5. WHERE lifetime value is zero and no deals exist, THE Analytics_Panel SHALL display a prompt encouraging the user to create the first deal rather than showing empty metric cards.

---

### Requirement 11: Quick Actions and Keyboard Shortcuts

**User Story:** As a power user, I want keyboard shortcuts for common actions on the workspace, so that I can operate without reaching for the mouse.

#### Acceptance Criteria

1. THE Workspace SHALL support the following keyboard shortcuts while the workspace is focused: `N` to open "Add Note", `T` to open "Create Task", `D` to open "Add Deal", `F` to open "Schedule Follow-up".
2. WHEN a keyboard shortcut is activated while a text input is focused, THE Workspace SHALL NOT trigger the Quick_Action to prevent accidental activation.
3. THE Workspace SHALL display a keyboard shortcut hint tooltip on Quick_Action buttons visible on hover.
4. WHEN the Command Palette is opened (Cmd+K / Ctrl+K) from within the Workspace, THE Workspace SHALL surface customer-specific actions including the four Quick Actions pre-scoped to the current customer.

---

### Requirement 12: Access Control

**User Story:** As a system administrator, I want the workspace to respect existing role-based access controls, so that users only see and edit data they are permitted to access.

#### Acceptance Criteria

1. WHILE a user has the `viewer` role, THE Workspace SHALL display all panels in read-only mode and hide Quick_Action buttons that create or modify records.
2. WHILE a user has the `sales_rep` role, THE Workspace SHALL allow full read and write access to customers assigned to that user and read-only access to unassigned customers.
3. WHILE a user has the `admin` or `manager` role, THE Workspace SHALL allow full read and write access to all customer records.
4. IF a user attempts to call a write API from the Workspace without the required permission, THEN THE Workspace SHALL display a permission denied message and revert any optimistic UI updates.
5. THE Workspace SHALL use the same RBAC middleware already in place at the API layer — no new permission model is introduced.
