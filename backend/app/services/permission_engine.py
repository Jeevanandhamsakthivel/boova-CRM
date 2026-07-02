"""Dynamic Permission Engine - Generates and evaluates permissions based on employee, role, department, and workflow stage."""
from app.db import get_db
from app.utils.helpers import utcnow


def generate_organization_permissions(organization_id, roles, departments, workflows=None):
    """Generate complete permission matrix for an organization."""
    db = get_db()
    permissions = []

    for role in roles:
        role_name = role.get("name", "")
        role_id = role.get("id", "")
        role_level = role.get("level", 5)

        base_permissions = _get_base_permissions_for_level(role_level)

        permissions.append({
            "organization_id": organization_id,
            "role": role_name,
            "role_id": role_id,
            "permissions": base_permissions,
            "is_dynamic": True,
            "generated_at": utcnow(),
        })

    if permissions:
        db.permissions.insert_many(permissions)

    return permissions


def _get_base_permissions_for_level(level):
    all_perms = [
        "leads.read", "leads.create", "leads.update", "leads.delete",
        "customers.read", "customers.create", "customers.update", "customers.delete",
        "deals.read", "deals.create", "deals.update", "deals.delete",
        "tasks.read", "tasks.create", "tasks.update", "tasks.delete",
        "tickets.read", "tickets.create", "tickets.update", "tickets.delete",
        "reports.read", "reports.create",
        "workflows.read", "workflows.create", "workflows.update", "workflows.delete",
        "users.read", "users.create", "users.update", "users.delete",
        "settings.read", "settings.update",
        "finance.read", "finance.create", "finance.update", "finance.approve",
        "pipeline.read", "pipeline.update",
    ]

    if level <= 1:
        return ["*", "admin.*", "settings.*"]
    if level <= 2:
        return ["*"]
    if level <= 3:
        return [p for p in all_perms if not p.startswith("settings.")]
    if level <= 4:
        return [p for p in all_perms if p.endswith(".read") or p.endswith(".create") or p.endswith(".update")]
    return [p for p in all_perms if p.endswith(".read")]


def evaluate_workflow_permission(execution, node, user_id):
    """Check if a user has permission to execute/approve a workflow node."""
    db = get_db()
    user = db.users.find_one({"_id": user_id})
    if not user:
        return False

    role = user.get("role", "")
    perm_record = db.permissions.find_one({"role": role})
    if not perm_record:
        return False

    perms = perm_record.get("permissions", [])
    if "*" in perms:
        return True

    node_type = node.get("type", "")
    node_perm = f"workflows.{node_type}"

    for p in perms:
        if p == node_perm:
            return True
        if p.endswith(".*") and node_perm.startswith(p[:-1]):
            return True

    return False


def get_permissions_for_role(role_name, organization_id=None):
    """Get effective permissions for a role."""
    db = get_db()
    query = {"role": role_name}
    if organization_id:
        query["organization_id"] = organization_id
    record = db.permissions.find_one(query)
    if record:
        return record.get("permissions", [])
    return ["self.read"]


def update_permissions_for_user(user_id, new_permissions):
    """Update permissions when user role/department changes."""
    db = get_db()
    user = db.users.find_one({"_id": user_id})
    if not user:
        return False
    role = user.get("role", "")
    db.permissions.update_one(
        {"role": role},
        {"$set": {"permissions": new_permissions, "updated_at": utcnow()}}
    )
    return True


def get_workflow_stage_permissions(workflow_id, stage_id):
    """Get permissions required for a specific workflow stage."""
    db = get_db()
    workflow = db.workflows.find_one({"_id": workflow_id})
    if not workflow:
        return {}
    stages = workflow.get("stages", [])
    for stage in stages:
        if stage.get("id") == stage_id:
            return stage.get("permissions", {})
    return {}
