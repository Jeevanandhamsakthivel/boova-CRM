"""Employee Setup Routes - For the wizard employee information step."""
import csv
import io
import uuid
from datetime import datetime
from flask import Blueprint, request, g
from bson import ObjectId
from app.utils.responses import success_response, error_response
from app.utils.helpers import serialize_doc
from app.middlewares.auth_middleware import jwt_required_custom

employee_setup_bp = Blueprint("employee_setup", __name__, url_prefix="/api/employee-setup")


@employee_setup_bp.post("/validate")
def validate_employee_structure():
    """Validate employee hierarchy before generation."""
    data = request.get_json(force=True, silent=True) or {}
    employees = data.get("employees", [])
    departments = data.get("departments", [])
    roles = data.get("roles", [])

    errors = []
    emp_ids = {e.get("id") for e in employees}
    dept_names = {d.get("name") for d in departments}

    for emp in employees:
        if not emp.get("name"):
            errors.append(f"Employee missing name")
        if emp.get("manager_id") and emp["manager_id"] not in emp_ids:
            errors.append(f"Employee '{emp.get('name')}' has invalid manager reference")

    return success_response({
        "valid": len(errors) == 0,
        "errors": errors,
        "employee_count": len(employees),
        "department_count": len(departments),
        "role_count": len(roles),
    })


@employee_setup_bp.post("/parse-csv")
def parse_employee_csv():
    """Parse uploaded CSV file and return employee data."""
    if "file" not in request.files:
        return error_response("No file uploaded", 400)

    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return error_response("Only CSV files are supported", 400)

    content = file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))

    employees = []
    required_fields = ["name", "email", "role", "department"]
    for row in reader:
        emp = {
            "id": str(uuid.uuid4()),
            "name": row.get("name", "").strip(),
            "email": row.get("email", "").strip(),
            "role": row.get("role", "").strip(),
            "department": row.get("department", "").strip(),
            "manager_name": row.get("manager", "").strip(),
            "phone": row.get("phone", "").strip(),
            "team": row.get("team", "").strip(),
            "branch": row.get("branch", "").strip(),
            "employee_id": row.get("employee_id", "").strip(),
        }
        if emp["name"]:
            employees.append(emp)

    return success_response({
        "employees": employees,
        "count": len(employees),
        "fields": reader.fieldnames or [],
    })


@employee_setup_bp.post("/generate-structure")
def generate_employee_structure():
    """Generate organization structure from wizard employee data."""
    data = request.get_json(force=True, silent=True) or {}
    employees = data.get("employees", [])
    template = data.get("template", {})
    basic_info = data.get("basic_info", {})

    departments = _extract_departments(employees, template)
    roles = _extract_roles(employees, template)
    hierarchy = _build_hierarchy(employees)
    teams = _extract_teams(employees)

    return success_response({
        "departments": departments,
        "roles": roles,
        "teams": teams,
        "hierarchy": hierarchy,
        "employee_count": len(employees),
        "department_count": len(departments),
        "role_count": len(roles),
    })


def _extract_departments(employees, template):
    template_depts = template.get("departments", [])
    emp_depts = set()
    for emp in employees:
        dept = emp.get("department", "").strip()
        if dept:
            emp_depts.add(dept)

    departments = []
    for dept_name in emp_depts:
        template_dept = next((d for d in template_depts if d["name"].lower() == dept_name.lower()), None)
        departments.append({
            "id": str(uuid.uuid4()),
            "name": dept_name,
            "teams": template_dept.get("teams", []) if template_dept else [],
            "order": len(departments) + 1,
        })

    for t_dept in template_depts:
        if not any(d["name"].lower() == t_dept["name"].lower() for d in departments):
            departments.append({
                "id": str(uuid.uuid4()),
                "name": t_dept["name"],
                "teams": t_dept.get("teams", []),
                "order": len(departments) + 1,
            })

    return departments


def _extract_roles(employees, template):
    template_roles = template.get("roles", [])
    emp_roles = {}
    for emp in employees:
        role_name = emp.get("role", "").strip()
        if role_name and role_name not in emp_roles:
            template_role = next((r for r in template_roles if r["name"].lower() == role_name.lower()), None)
            level = template_role.get("level", 3) if template_role else 3
            emp_roles[role_name] = {"level": level, "department": emp.get("department", "")}

    roles = []
    for name, info in emp_roles.items():
        roles.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "level": info["level"],
            "department": info["department"],
        })

    for t_role in template_roles:
        if not any(r["name"].lower() == t_role["name"].lower() for r in roles):
            roles.append({
                "id": str(uuid.uuid4()),
                "name": t_role["name"],
                "level": t_role.get("level", 3),
                "department": t_role.get("department", ""),
            })

    return roles


def _build_hierarchy(employees):
    emp_map = {e.get("id"): e for e in employees}
    levels = {}
    for emp in employees:
        manager_id = emp.get("manager_id")
        level = 1
        if manager_id and manager_id in emp_map:
            parent_level = emp_map[manager_id].get("_level", 1)
            level = parent_level + 1
        emp["_level"] = level
        if level not in levels:
            levels[level] = []
        levels[level].append(emp)

    return {
        "levels": [{"level": lvl, "count": len(emps)} for lvl, emps in sorted(levels.items())],
        "total_employees": len(employees),
        "max_depth": max(levels.keys()) if levels else 0,
    }


def _extract_teams(employees):
    teams = {}
    for emp in employees:
        dept = emp.get("department", "General")
        team = emp.get("team", "General")
        if dept not in teams:
            teams[dept] = set()
        teams[dept].add(team)

    return [{"department": d, "teams": list(t)} for d, t in teams.items()]
