"""
Role-Based Access Control definitions, per SRS Chapter 8
(Role Based Access Control).

Three built-in roles are seeded by default:
- admin: full access to every module, user management, settings.
- manager: full access to CRM data (leads/customers/deals/tasks/reports),
  no user management.
- agent: access scoped to records assigned to them; can create leads,
  customers, tasks, follow-ups; cannot delete or manage users/settings.
"""

ROLE_ADMIN = "admin"
ROLE_MANAGER = "manager"
ROLE_AGENT = "agent"

ALL_ROLES = [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT]

# Permission keys, grouped by module.
PERMISSIONS = {
    "users.manage": [ROLE_ADMIN],
    "roles.manage": [ROLE_ADMIN],
    "settings.manage": [ROLE_ADMIN],

    "leads.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "leads.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "leads.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "leads.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "customers.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "customers.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "customers.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "customers.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "followups.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "followups.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "followups.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "followups.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "tasks.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "tasks.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "tasks.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "tasks.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "deals.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "deals.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "deals.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "deals.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "reports.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "audit.read": [ROLE_ADMIN],

    "companies.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "companies.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "companies.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "companies.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "quotes.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "quotes.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "quotes.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "quotes.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "invoices.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "invoices.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "invoices.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "invoices.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "tickets.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "tickets.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "tickets.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "tickets.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "kb.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "kb.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "kb.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "kb.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "email.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "email.send": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],

    "whatsapp.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "whatsapp.send": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],

    "calendar.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "calendar.create": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "calendar.update": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "calendar.delete": [ROLE_ADMIN, ROLE_MANAGER],

    "automation.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "automation.create": [ROLE_ADMIN, ROLE_MANAGER],
    "automation.update": [ROLE_ADMIN, ROLE_MANAGER],
    "automation.delete": [ROLE_ADMIN],

    "bulk.actions": [ROLE_ADMIN, ROLE_MANAGER],
    "migration.read": [ROLE_ADMIN, ROLE_MANAGER],

    "workflows.read": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "workflows.create": [ROLE_ADMIN, ROLE_MANAGER],
    "workflows.update": [ROLE_ADMIN, ROLE_MANAGER],
    "workflows.delete": [ROLE_ADMIN],
    "workflows.execute": [ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT],
    "workflows.approve": [ROLE_ADMIN, ROLE_MANAGER],
    "workflows.analytics": [ROLE_ADMIN, ROLE_MANAGER],
}


def role_has_permission(role, permission_key):
    allowed_roles = PERMISSIONS.get(permission_key, [])
    return role in allowed_roles