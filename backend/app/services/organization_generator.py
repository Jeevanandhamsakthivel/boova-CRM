import uuid
from datetime import datetime
from app.services.business_template_service import BUSINESS_TEMPLATES


def generate_organization(basic_info: dict, analysis: dict) -> dict:
    biz_type = basic_info.get("business_type") or analysis.get("business_type", "custom_business")
    template = BUSINESS_TEMPLATES.get(biz_type, BUSINESS_TEMPLATES["custom_business"])

    departments_data = analysis.get("departments") or template["departments"]
    roles_data = analysis.get("roles") or template["roles"]
    lifecycle_data = analysis.get("customer_lifecycle") or template["customer_lifecycle"]
    workflows_data = analysis.get("workflows") or template["workflows"]
    dashboards_data = analysis.get("dashboards") or template["dashboards"]
    forms_data = analysis.get("forms") or template["forms"]
    automations_data = analysis.get("automations") or template["automations"]
    permissions_data = analysis.get("permissions") or template["permissions"]

    employee_count = basic_info.get("employee_count") or analysis.get("employee_count", 10)
    branch_count = basic_info.get("branch_count", 1)

    branches = []
    for i in range(branch_count):
        branches.append({
            "id": str(uuid.uuid4()),
            "name": f"Branch {i + 1}" if i > 0 else "Head Office",
            "is_head_office": i == 0,
            "address": basic_info.get("address", ""),
            "country": basic_info.get("country", ""),
            "timezone": basic_info.get("timezone", "UTC"),
            "created_at": datetime.utcnow().isoformat(),
        })

    departments = []
    for i, dept in enumerate(departments_data):
        dept_id = str(uuid.uuid4())
        departments.append({
            "id": dept_id,
            "name": dept["name"],
            "order": i + 1,
            "teams": [{"id": str(uuid.uuid4()), "name": t} for t in dept.get("teams", [])],
            "branch_ids": [b["id"] for b in branches],
            "created_at": datetime.utcnow().isoformat(),
        })

    department_names = [d["name"] for d in departments]

    roles = generate_roles_with_employees(roles_data, departments, employee_count)

    hierarchy_tree = generate_hierarchy_tree(roles, departments)

    pipeline_stages = generate_pipeline_stages(lifecycle_data)

    workflows = generate_workflows(workflows_data, departments, roles)

    dashboards = generate_dashboards(dashboards_data)

    forms = generate_forms(forms_data)

    automations = generate_automations(automations_data)

    permissions = generate_permissions(permissions_data, roles)

    return {
        "organization": {
            "name": basic_info.get("company_name", ""),
            "business_name": basic_info.get("business_name", ""),
            "business_type": biz_type,
            "business_type_name": template["name"],
            "employee_count": employee_count,
            "branch_count": branch_count,
            "country": basic_info.get("country", ""),
            "timezone": basic_info.get("timezone", "UTC"),
            "language": basic_info.get("language", "en"),
            "created_at": datetime.utcnow().isoformat(),
        },
        "branches": branches,
        "departments": departments,
        "roles": roles,
        "hierarchy_tree": hierarchy_tree,
        "pipeline_stages": pipeline_stages,
        "workflows": workflows,
        "dashboards": dashboards,
        "forms": forms,
        "automations": automations,
        "permissions": permissions,
    }


def generate_roles_with_employees(role_templates: list, departments: list, employee_count: int) -> list:
    roles = []
    emp_id = 0
    for i, rt in enumerate(role_templates):
        dept_id = ""
        for d in departments:
            if rt.get("department", "").lower() in d["name"].lower():
                dept_id = d["id"]
                break
        if not dept_id and departments:
            dept_id = departments[0]["id"]

        role_count = max(1, employee_count // max(len(role_templates), 1))
        if i < 3:
            role_count = 1

        role_id = str(uuid.uuid4())
        employees = []
        for j in range(role_count):
            emp_id += 1
            employees.append({
                "id": str(uuid.uuid4()),
                "name": f"{rt['name']} {j + 1}",
                "email": f"{rt['name'].lower().replace(' ', '.')}{j + 1}@company.com",
                "role": rt["name"],
                "level": rt.get("level", 3),
                "department_id": dept_id,
                "employee_id": f"EMP{emp_id:04d}",
                "status": "active",
            })

        manager_reporting = None
        if i > 0:
            for prev_role in role_templates[:i]:
                if prev_role.get("level", 5) < rt.get("level", 5):
                    manager_reporting = prev_role["name"]
                    break

        roles.append({
            "id": role_id,
            "name": rt["name"],
            "level": rt.get("level", 3),
            "department_id": dept_id,
            "department_name": next((d["name"] for d in departments if d["id"] == dept_id), ""),
            "employees": employees,
            "reports_to": manager_reporting,
            "created_at": datetime.utcnow().isoformat(),
        })

    return roles


def generate_hierarchy_tree(roles: list, departments: list) -> dict:
    if not roles:
        return {"root": None, "levels": []}

    sorted_roles = sorted(roles, key=lambda r: r.get("level", 99))
    levels = []
    current_level = 0
    current_group = []

    for role in sorted_roles:
        lvl = role.get("level", 3)
        if lvl != current_level:
            if current_group:
                levels.append({"level": current_level, "roles": current_group})
            current_level = lvl
            current_group = [role]
        else:
            current_group.append(role)

    if current_group:
        levels.append({"level": current_level, "roles": current_group})

    return {
        "root": sorted_roles[0]["name"] if sorted_roles else None,
        "levels": levels,
        "total_employees": sum(len(r["employees"]) for r in roles),
        "department_count": len(departments),
    }


def generate_pipeline_stages(lifecycle: list) -> list:
    stages = []
    for i, stage_name in enumerate(lifecycle):
        colors = ["#6D28D9", "#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#DB2777"]
        stages.append({
            "id": str(uuid.uuid4()),
            "name": stage_name,
            "order": i + 1,
            "color": colors[i % len(colors)],
            "category": "active" if i < len(lifecycle) - 1 else "completed",
        })
    return stages


def generate_workflows(workflow_keys: list, departments: list, roles: list) -> list:
    workflow_templates = []
    for key in workflow_keys:
        wf_id = str(uuid.uuid4())
        assigned_dept = departments[0]["name"] if departments else "General"
        wf = {
            "id": wf_id,
            "name": key.replace("_", " ").title(),
            "key": key,
            "description": f"Automated {key.replace('_', ' ')} workflow",
            "status": "active",
            "category": determine_workflow_category(key),
            "entity_type": "task",
            "assigned_department": assigned_dept,
            "created_at": datetime.utcnow().isoformat(),
        }
        workflow_templates.append(wf)
    return workflow_templates


def determine_workflow_category(key: str) -> str:
    category_map = {
        "customer": "crm", "leave": "hr", "purchase": "procurement",
        "expense": "finance", "invoice": "finance", "support": "support",
        "bug": "development", "feature": "development", "deployment": "development",
        "site": "operations", "material": "procurement", "patient": "healthcare",
        "appointment": "healthcare", "discharge": "healthcare", "student": "education",
        "booking": "hospitality", "donor": "nonprofit", "claim": "insurance",
        "case": "legal", "production": "manufacturing", "quality": "manufacturing",
        "dispatch": "logistics", "vendor": "procurement", "maintenance": "operations",
        "prescription": "healthcare", "stock": "inventory", "fee": "finance",
        "exam": "education", "placement": "education", "library": "education",
        "event": "operations", "hostel": "education", "grant": "research",
        "publication": "research", "scholarship": "education", "faculty": "hr",
        "credit": "finance", "bulk": "sales", "booking": "hospitality",
        "route": "operations", "incident": "operations", "fuel": "operations",
        "policy": "insurance", "commission": "finance", "property": "real_estate",
        "offer": "sales", "agreement": "legal", "inspection": "operations",
        "campaign": "marketing", "creative": "marketing", "content": "marketing",
        "media": "marketing", "report": "analytics", "kyc": "compliance",
        "loan": "finance", "case": "legal", "conflict": "legal",
        "timesheet": "hr", "travel": "hr", "engagement": "sales",
        "deliverable": "operations", "recruitment": "hr", "budget": "finance",
        "file": "operations", "grievance": "support", "driver": "operations",
        "booking": "hospitality", "menu": "operations", "health": "compliance",
        "volunteer": "nonprofit", "donation": "nonprofit", "beneficiary": "nonprofit",
        "citizen": "government", "tender": "procurement", "safety": "operations",
        "change": "operations", "project": "operations", "approval": "operations",
    }
    for k, cat in category_map.items():
        if k in key:
            return cat
    return "operations"


def generate_dashboards(dashboard_templates: list) -> list:
    dashboards = []
    for i, db in enumerate(dashboard_templates):
        dashboards.append({
            "id": str(uuid.uuid4()),
            "title": db["title"],
            "order": i + 1,
            "widgets": [
                {"id": str(uuid.uuid4()), "title": w.replace("_", " ").title(), "type": determine_widget_type(w)}
                for w in db.get("widgets", [])
            ],
            "created_at": datetime.utcnow().isoformat(),
        })
    return dashboards


def determine_widget_type(widget_key: str) -> str:
    if widget_key in ["revenue", "revenue_trends", "daily_sales", "monthly_revenue", "daily_collection",
                       "pending_quotes", "pending_quotations", "pending_approvals", "revenue_forecast"]:
        return "metric"
    if widget_key in ["active_projects", "active_orders", "active_shipments", "active_cases", "active_listings",
                       "patient_count", "student_count", "employee_count", "staff_count", "active_users",
                       "customer_count", "donor_count"]:
        return "count"
    if widget_key in ["chart", "bar_chart", "pie_chart", "line_chart", "sprint_progress", "budget_vs_actual"]:
        return "chart"
    if widget_key in ["site_progress", "project_milestones", "production_target"]:
        return "progress"
    return "list"


def generate_forms(form_names: list) -> list:
    forms = []
    for i, name in enumerate(form_names):
        forms.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "title": f"{name} Form",
            "order": i + 1,
            "status": "published",
            "fields": generate_form_fields(name),
            "created_at": datetime.utcnow().isoformat(),
        })
    return forms


def generate_form_fields(form_name: str) -> list:
    base_fields = [
        {"name": "title", "type": "text", "label": "Title", "required": True},
        {"name": "description", "type": "textarea", "label": "Description", "required": False},
    ]

    specific_fields_map = {
        "Quotation": [
            {"name": "customer_name", "type": "text", "label": "Customer Name", "required": True},
            {"name": "amount", "type": "number", "label": "Amount", "required": True},
            {"name": "valid_until", "type": "date", "label": "Valid Until", "required": False},
        ],
        "Purchase Order": [
            {"name": "vendor_name", "type": "text", "label": "Vendor Name", "required": True},
            {"name": "items", "type": "textarea", "label": "Items", "required": True},
            {"name": "total_amount", "type": "number", "label": "Total Amount", "required": True},
            {"name": "delivery_date", "type": "date", "label": "Delivery Date", "required": True},
        ],
        "Patient Registration": [
            {"name": "full_name", "type": "text", "label": "Full Name", "required": True},
            {"name": "age", "type": "number", "label": "Age", "required": True},
            {"name": "gender", "type": "select", "label": "Gender", "options": ["Male", "Female", "Other"], "required": True},
            {"name": "blood_group", "type": "select", "label": "Blood Group", "options": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], "required": False},
            {"name": "phone", "type": "tel", "label": "Phone Number", "required": True},
        ],
        "Bug Report": [
            {"name": "severity", "type": "select", "label": "Severity", "options": ["Critical", "Major", "Minor", "Trivial"], "required": True},
            {"name": "steps_to_reproduce", "type": "textarea", "label": "Steps to Reproduce", "required": True},
            {"name": "expected_behavior", "type": "textarea", "label": "Expected Behavior", "required": True},
            {"name": "actual_behavior", "type": "textarea", "label": "Actual Behavior", "required": True},
            {"name": "environment", "type": "text", "label": "Environment", "required": False},
        ],
        "Leave Application": [
            {"name": "leave_type", "type": "select", "label": "Leave Type", "options": ["Annual", "Sick", "Personal", "Other"], "required": True},
            {"name": "start_date", "type": "date", "label": "Start Date", "required": True},
            {"name": "end_date", "type": "date", "label": "End Date", "required": True},
            {"name": "reason", "type": "textarea", "label": "Reason", "required": True},
        ],
        "Expense Report": [
            {"name": "category", "type": "select", "label": "Category", "options": ["Travel", "Food", "Office Supplies", "Transport", "Other"], "required": True},
            {"name": "amount", "type": "number", "label": "Amount", "required": True},
            {"name": "receipt", "type": "file", "label": "Receipt", "required": False},
            {"name": "notes", "type": "textarea", "label": "Notes", "required": False},
        ],
        "Invoice": [
            {"name": "customer_name", "type": "text", "label": "Customer", "required": True},
            {"name": "invoice_date", "type": "date", "label": "Invoice Date", "required": True},
            {"name": "due_date", "type": "date", "label": "Due Date", "required": True},
            {"name": "line_items", "type": "textarea", "label": "Line Items", "required": True},
            {"name": "tax_rate", "type": "number", "label": "Tax Rate (%)", "required": False},
        ],
        "Lead Capture": [
            {"name": "contact_name", "type": "text", "label": "Contact Name", "required": True},
            {"name": "email", "type": "email", "label": "Email", "required": True},
            {"name": "phone", "type": "tel", "label": "Phone", "required": True},
            {"name": "source", "type": "select", "label": "Source", "options": ["Website", "Referral", "Social Media", "Walk-in", "Call", "Email", "Other"], "required": False},
        ],
    }

    for key, fields in specific_fields_map.items():
        if key.lower() in form_name.lower():
            return fields

    return base_fields


def generate_automations(automation_templates: list) -> list:
    automations = []
    for i, auto in enumerate(automation_templates):
        automations.append({
            "id": str(uuid.uuid4()),
            "name": f"Auto: {auto['trigger'].replace('_', ' ').title()}",
            "trigger": auto["trigger"],
            "trigger_type": "event",
            "actions": [
                {"order": j + 1, "type": a.replace("notify_", "notification.").replace("create_", "record.create.").replace("update_", "record.update.").replace("assign_", "assignment.").replace("generate_", "document."),
                 "label": a.replace("_", " ").title()}
                for j, a in enumerate(auto.get("actions", []))
            ],
            "status": "active",
            "order": i + 1,
            "created_at": datetime.utcnow().isoformat(),
        })
    return automations


def generate_permissions(permission_templates: dict, roles: list) -> list:
    permissions = []
    for role in roles:
        role_name = role["name"]
        perms = permission_templates.get(role_name, ["self.*"])
        permissions.append({
            "id": str(uuid.uuid4()),
            "role": role_name,
            "role_id": role["id"],
            "permissions": perms,
            "is_dynamic": True,
            "created_at": datetime.utcnow().isoformat(),
        })
    return permissions


def generate_organization_from_employees(basic_info: dict, analysis: dict, employees: list = None) -> dict:
    """Generate organization using actual employee data from wizard."""
    biz_type = basic_info.get("business_type") or analysis.get("business_type", "custom_business")
    template = BUSINESS_TEMPLATES.get(biz_type, BUSINESS_TEMPLATES["custom_business"])

    departments_data = analysis.get("departments") or template["departments"]
    roles_data = analysis.get("roles") or template["roles"]
    lifecycle_data = analysis.get("customer_lifecycle") or template["customer_lifecycle"]
    workflows_data = analysis.get("workflows") or template["workflows"]
    dashboards_data = analysis.get("dashboards") or template["dashboards"]
    forms_data = analysis.get("forms") or template["forms"]
    automations_data = analysis.get("automations") or template["automations"]
    permissions_data = analysis.get("permissions") or template["permissions"]

    branch_count = basic_info.get("branch_count", 1)

    branches = []
    for i in range(branch_count):
        branches.append({
            "id": str(uuid.uuid4()),
            "name": f"Branch {i + 1}" if i > 0 else "Head Office",
            "is_head_office": i == 0,
            "address": basic_info.get("address", ""),
            "country": basic_info.get("country", ""),
            "timezone": basic_info.get("timezone", "UTC"),
            "created_at": datetime.utcnow().isoformat(),
        })

    departments = []
    for i, dept in enumerate(departments_data):
        dept_id = str(uuid.uuid4())
        departments.append({
            "id": dept_id,
            "name": dept["name"],
            "order": i + 1,
            "teams": [{"id": str(uuid.uuid4()), "name": t} for t in dept.get("teams", [])],
            "branch_ids": [b["id"] for b in branches],
            "created_at": datetime.utcnow().isoformat(),
        })

    roles = generate_roles_from_employees(roles_data, departments, employees)
    hierarchy_tree = build_employee_hierarchy(employees, departments, roles)
    pipeline_stages = generate_pipeline_stages(lifecycle_data)
    workflows = generate_workflows_from_employees(workflows_data, departments, roles, employees)
    dashboards = generate_dashboards(dashboards_data)
    forms = generate_forms(forms_data)
    automations = generate_automations(automations_data)
    permissions = generate_permissions(permissions_data, roles)

    return {
        "organization": {
            "name": basic_info.get("company_name", ""),
            "business_name": basic_info.get("business_name", ""),
            "business_type": biz_type,
            "business_type_name": template["name"],
            "employee_count": len(employees) if employees else basic_info.get("employee_count", 0),
            "branch_count": branch_count,
            "country": basic_info.get("country", ""),
            "timezone": basic_info.get("timezone", "UTC"),
            "language": basic_info.get("language", "en"),
            "created_at": datetime.utcnow().isoformat(),
        },
        "branches": branches,
        "departments": departments,
        "roles": roles,
        "hierarchy_tree": hierarchy_tree,
        "pipeline_stages": pipeline_stages,
        "workflows": workflows,
        "dashboards": dashboards,
        "forms": forms,
        "automations": automations,
        "permissions": permissions,
        "employee_count": len(employees) if employees else 0,
    }


def generate_roles_from_employees(role_templates, departments, employees=None):
    """Generate roles using actual employees or fall back to templates."""
    if not employees:
        return generate_roles_with_employees(role_templates, departments, 10)

    department_map = {d["name"].lower(): d for d in departments}
    role_groups = {}
    for emp in employees:
        role_name = emp.get("role", "Employee").strip()
        dept_name = emp.get("department", "").strip().lower()
        dept = department_map.get(dept_name, departments[0] if departments else None)
        dept_id = dept["id"] if dept else ""
        dept_name_display = dept["name"] if dept else "General"

        if role_name not in role_groups:
            role_level = 3
            for rt in role_templates:
                if rt["name"].lower() == role_name.lower():
                    role_level = rt.get("level", 3)
                    break
            role_groups[role_name] = {
                "id": str(uuid.uuid4()),
                "name": role_name,
                "level": role_level,
                "department_id": dept_id,
                "department_name": dept_name_display,
                "employees": [],
                "reports_to": None,
                "created_at": datetime.utcnow().isoformat(),
            }

        role_groups[role_name]["employees"].append({
            "id": emp.get("id") or str(uuid.uuid4()),
            "name": emp["name"],
            "email": emp.get("email", f"{emp['name'].lower().replace(' ', '.')}@company.com"),
            "role": role_name,
            "level": role_groups[role_name]["level"],
            "department_id": dept_id,
            "employee_id": emp.get("employee_id", f"EMP{hash(emp['name']) % 10000:04d}"),
            "manager_id": emp.get("manager_id"),
            "phone": emp.get("phone", ""),
            "team": emp.get("team", ""),
            "status": "active",
        })

    roles = list(role_groups.values())
    sorted_roles = sorted(roles, key=lambda r: r.get("level", 99))
    for i, role in enumerate(sorted_roles):
        role["reports_to"] = _find_manager_role(role, sorted_roles)

    return sorted_roles


def _find_manager_role(role, all_roles):
    role_level = role.get("level", 99)
    for r in all_roles:
        if r.get("level", 99) < role_level:
            return r["name"]
    return None


def build_employee_hierarchy(employees, departments, roles):
    if not employees:
        return {"root": None, "levels": [], "total_employees": 0, "department_count": len(departments)}

    emp_map = {e.get("id"): e for e in employees}
    role_map = {r["name"]: r for r in roles}
    adj = {e.get("id"): [] for e in employees}
    roots = []

    for emp in employees:
        mgr_id = emp.get("manager_id")
        if mgr_id and mgr_id in emp_map:
            adj.setdefault(mgr_id, []).append(emp["id"])
        else:
            roots.append(emp["id"])

    visited = set()
    levels_data = []

    def bfs(start_ids, level=0):
        current = start_ids
        while current:
            level_emps = []
            next_level = []
            for eid in current:
                if eid in visited:
                    continue
                visited.add(eid)
                emp = emp_map.get(eid, {})
                role = role_map.get(emp.get("role", ""), {})
                level_emps.append({
                    "id": eid,
                    "name": emp.get("name", ""),
                    "role": emp.get("role", ""),
                    "level": role.get("level", 3),
                    "department": emp.get("department", ""),
                })
                for child_id in adj.get(eid, []):
                    if child_id not in visited:
                        next_level.append(child_id)
            if level_emps:
                levels_data.append({"level": level, "employees": level_emps})
            current = next_level
            level += 1

    bfs(roots)

    return {
        "root": emp_map.get(roots[0], {}).get("name", "") if roots else None,
        "levels": levels_data,
        "total_employees": len(employees),
        "department_count": len(departments),
    }


def generate_workflows_from_employees(workflow_keys, departments, roles, employees):
    """Generate workflows with actual employee references as owners/approvers."""
    workflows = []
    for key in workflow_keys:
        wf_id = str(uuid.uuid4())
        assigned_dept = departments[0]["name"] if departments else "General"
        assigned_role = roles[0]["name"] if roles else "Employee"

        nodes, edges = generate_workflow_nodes(key, departments, roles, employees)

        wf = {
            "id": wf_id,
            "name": key.replace("_", " ").title(),
            "key": key,
            "description": f"Automated {key.replace('_', ' ')} workflow",
            "status": "active",
            "category": determine_workflow_category(key),
            "entity_type": _get_workflow_entity_type(key),
            "assigned_department": assigned_dept,
            "assigned_role": assigned_role,
            "nodes": nodes,
            "edges": edges,
            "stages": _generate_workflow_stages(key),
            "version": 1,
            "created_at": datetime.utcnow().isoformat(),
        }
        workflows.append(wf)
    return workflows


def generate_workflow_nodes(key, departments, roles, employees):
    """Generate actual workflow nodes with employee references."""
    nodes = []
    edges = []
    node_id = 0

    def nid():
        nonlocal node_id
        node_id += 1
        return f"n{node_id}"

    start_id = nid()
    end_id = nid()
    x_pos = 100

    nodes.append({
        "id": start_id, "type": "start", "label": "Start",
        "position": {"x": x_pos, "y": 220}, "config": {}
    })
    x_pos += 280

    prev_id = start_id

    if key in ("customer_management", "lead_management"):
        assoc_role = next((r for r in roles if "sales" in r.get("department_name", "").lower() or "marketing" in r.get("department_name", "").lower()), None)
        aid = nid()
        nodes.append({"id": aid, "type": "assign_owner", "label": "Assign to Sales", "position": {"x": x_pos, "y": 220}, "config": {"assignment_type": "direct", "department": assoc_role.get("department_name", "Sales") if assoc_role else "Sales"}})
        edges.append({"id": f"e{node_id}", "source": prev_id, "target": aid, "label": "Assign"})
        prev_id = aid
        x_pos += 280

        cid = nid()
        nodes.append({"id": cid, "type": "condition", "label": "Qualified?", "position": {"x": x_pos, "y": 220}, "config": {"field": "status", "operator": "equals", "value": "qualified"}})
        edges.append({"id": f"e{node_id}", "source": prev_id, "target": cid, "label": "Check"})
        prev_id = cid
        x_pos += 280

    elif key in ("leave_approval", "expense_approval", "purchase_request", "invoice_approval"):
        cid = nid()
        nodes.append({"id": cid, "type": "condition", "label": "Auto-Approval?", "position": {"x": x_pos, "y": 220}, "config": {"field": "amount", "operator": "less_than", "value": "1000"}})
        edges.append({"id": f"e{node_id}", "source": prev_id, "target": cid, "label": "Check"})
        prev_id = cid
        x_pos += 280

        aid = nid()
        mgr_role = next((r for r in roles if r.get("level", 99) == 3 or r.get("level", 99) == 2), None)
        nodes.append({"id": aid, "type": "approval", "label": "Manager Approval", "position": {"x": x_pos, "y": 160}, "config": {"approval_type": "single", "assign_to_role": mgr_role["name"] if mgr_role else "manager", "required_approvers": 1}})
        edges.append({"id": f"e{node_id}", "source": cid, "target": aid, "label": "Yes"})
        x_pos += 280

        rid = nid()
        nodes.append({"id": rid, "type": "reject", "label": "Rejected", "position": {"x": x_pos, "y": 340}, "config": {}})
        edges.append({"id": f"e{node_id}", "source": cid, "target": rid, "label": "No"})

        nid_a = nid()
        nodes.append({"id": nid_a, "type": "notification", "label": "Notify Approver", "position": {"x": x_pos, "y": 160}, "config": {"channels": ["in_app", "email"]}})
        edges.append({"id": f"e{node_id}", "source": aid, "target": nid_a, "label": "Approve"})
        prev_id = nid_a
        x_pos += 280

    elif key == "support_ticket":
        aid = nid()
        support_role = next((r for r in roles if "support" in r.get("department_name", "").lower() or "service" in r.get("department_name", "").lower()), None)
        nodes.append({"id": aid, "type": "assign_owner", "label": "Assign to Support", "position": {"x": x_pos, "y": 220}, "config": {"assignment_type": "round_robin", "department": support_role.get("department_name", "Support") if support_role else "Support"}})
        edges.append({"id": f"e{node_id}", "source": prev_id, "target": aid, "label": "Assign"})
        prev_id = aid
        x_pos += 280

        cid = nid()
        nodes.append({"id": cid, "type": "condition", "label": "Escalated?", "position": {"x": x_pos, "y": 220}, "config": {"field": "priority", "operator": "equals", "value": "high"}})
        edges.append({"id": f"e{node_id}", "source": prev_id, "target": cid, "label": "Check"})
        prev_id = cid
        x_pos += 280

    task_node = nid()
    nodes.append({"id": task_node, "type": "create_task", "label": "Create Follow-up", "position": {"x": x_pos, "y": 220}, "config": {"task_type": "followup", "priority": "medium", "due_days": 3}})
    edges.append({"id": f"e{node_id}", "source": prev_id, "target": task_node, "label": "Create"})
    prev_id = task_node
    x_pos += 280

    notif_node = nid()
    nodes.append({"id": notif_node, "type": "notification", "label": "Notify Stakeholders", "position": {"x": x_pos, "y": 220}, "config": {"channels": ["in_app", "email"], "title": "Workflow Update", "message": "A workflow task has been created."}})
    edges.append({"id": f"e{node_id}", "source": prev_id, "target": notif_node, "label": "Notify"})
    prev_id = notif_node
    x_pos += 280

    nodes.append({
        "id": end_id, "type": "end", "label": "Complete",
        "position": {"x": x_pos, "y": 220}, "config": {}
    })
    edges.append({"id": f"e{node_id}", "source": prev_id, "target": end_id, "label": "Finish"})

    return nodes, edges


def _get_workflow_entity_type(key):
    entity_map = {
        "customer": "customer", "lead": "lead", "leave": "user",
        "purchase": "task", "expense": "task", "invoice": "invoice",
        "support": "ticket", "bug": "task", "feature": "task",
        "site": "task", "material": "task", "patient": "customer",
        "student": "lead", "booking": "lead", "donor": "customer",
        "claim": "task", "case": "lead",
    }
    for k, v in entity_map.items():
        if k in key:
            return v
    return "task"


def _generate_workflow_stages(key):
    stage_map = {
        "customer": ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed"],
        "leave": ["Submitted", "Manager Review", "HR Review", "Approved", "Rejected"],
        "purchase": ["Draft", "Manager Approval", "Procurement", "Ordered", "Received"],
        "expense": ["Submitted", "Manager Approval", "Finance Review", "Paid", "Rejected"],
        "invoice": ["Draft", "Finance Review", "Approved", "Sent", "Paid", "Overdue"],
        "support": ["New", "Assigned", "In Progress", "Resolved", "Closed"],
        "bug": ["Reported", "Triaged", "In Development", "Testing", "Deployed", "Closed"],
        "patient": ["Registered", "Triage", "Consultation", "Treatment", "Discharged"],
        "student": ["Inquiry", "Application", "Documents", "Interview", "Admitted"],
        "booking": ["Inquiry", "Confirmed", "Checked In", "Checked Out", "Completed"],
    }
    for k, stages in stage_map.items():
        if k in key:
            return [{"id": str(uuid.uuid4()), "name": s, "order": i, "color": ["#6D28D9", "#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"][i % 6]} for i, s in enumerate(stages)]
    return [{"id": str(uuid.uuid4()), "name": "Open", "order": 0, "color": "#2563EB"},
            {"id": str(uuid.uuid4()), "name": "In Progress", "order": 1, "color": "#D97706"},
            {"id": str(uuid.uuid4()), "name": "Completed", "order": 2, "color": "#059669"}]
