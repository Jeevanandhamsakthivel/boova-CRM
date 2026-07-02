"""AI-Powered Business Setup Wizard - API Routes."""
from datetime import datetime
from flask import Blueprint, request, g
from bson import ObjectId
from app.utils.responses import success_response, error_response
from app.services.ai_business_analyzer import analyze_business, detect_business_type
from app.services.business_template_service import (
    get_all_templates, get_template, get_workflow_definition,
    get_departments, get_roles, get_customer_lifecycle,
    get_workflows, get_dashboards, get_forms, get_automations, get_permissions,
)
from app.services.organization_generator import generate_organization, generate_organization_from_employees
from app.middlewares.auth_middleware import jwt_required_custom

setup_wizard_bp = Blueprint("setup_wizard", __name__, url_prefix="/api/setup-wizard")


@setup_wizard_bp.get("/templates")
def list_templates():
    """Step 2: List all available business templates."""
    templates = get_all_templates()
    return success_response(templates)


@setup_wizard_bp.get("/templates/<business_type>")
def get_template_detail(business_type):
    """Get full template details for preview."""
    tmpl = get_template(business_type)
    if not tmpl:
        return error_response("Business type not found.", 404)
    return success_response({
        "id": business_type,
        "name": tmpl["name"],
        "icon": tmpl.get("icon", "🔧"),
        "description": tmpl["description"],
        "departments": tmpl["departments"],
        "roles": tmpl["roles"],
        "customer_lifecycle": tmpl["customer_lifecycle"],
        "workflows": [{"key": w, "name": w.replace("_", " ").title(),
                        "definition": get_workflow_definition(w)}
                       for w in tmpl["workflows"]],
        "dashboards": tmpl["dashboards"],
        "forms": tmpl["forms"],
        "automations": tmpl["automations"],
        "permissions": tmpl["permissions"],
    })


@setup_wizard_bp.post("/analyze")
def analyze_business_description():
    """Step 3: AI analyzes natural language business description."""
    data = request.get_json(force=True, silent=True) or {}
    description = data.get("description", "")
    basic_info = data.get("basic_info", {})

    if not description:
        return error_response("Please describe your business.", 400)

    try:
        analysis = analyze_business(description, basic_info)
        return success_response(analysis)
    except Exception as e:
        return error_response(f"Analysis failed: {str(e)}", 500)


@setup_wizard_bp.post("/generate")
@jwt_required_custom()
def generate_organization_structure():
    """Generate complete organization from wizard data (with optional employees)."""
    data = request.get_json(force=True, silent=True) or {}
    basic_info = data.get("basic_info", {})
    analysis = data.get("analysis", {})
    employees = data.get("employees", [])

    if not basic_info.get("company_name"):
        return error_response("Company name is required.", 400)

    try:
        if employees and len(employees) > 0:
            result = generate_organization_from_employees(basic_info, analysis, employees)
        else:
            result = generate_organization(basic_info, analysis)
        return success_response(result, message="Organization structure generated successfully.")
    except Exception as e:
        return error_response(f"Generation failed: {str(e)}", 500)


@setup_wizard_bp.post("/quick-preview")
def get_quick_preview():
    """Generate a quick preview without saving."""
    data = request.get_json(force=True, silent=True) or {}
    business_type = data.get("business_type", "custom_business")
    description = data.get("description", "")

    if description:
        analysis = analyze_business(description, data.get("basic_info", {}))
        business_type = analysis["business_type"]
    else:
        analysis = None

    basic_info = data.get("basic_info", {})
    basic_info["business_type"] = business_type

    if analysis:
        result = generate_organization(basic_info, analysis)
    else:
        from app.services.organization_generator import generate_organization
        analysis = {
            "business_type": business_type,
            "business_type_name": get_template(business_type)["name"],
            "departments": get_departments(business_type),
            "roles": get_roles(business_type),
            "customer_lifecycle": get_customer_lifecycle(business_type),
            "workflows": get_workflows(business_type),
            "dashboards": get_dashboards(business_type),
            "forms": get_forms(business_type),
            "automations": get_automations(business_type),
            "permissions": get_permissions(business_type),
        }
        result = generate_organization(basic_info, analysis)

    return success_response({
        "organization": result["organization"],
        "departments_count": len(result["departments"]),
        "branches_count": len(result["branches"]),
        "roles_count": len(result["roles"]),
        "total_employees": result["hierarchy_tree"]["total_employees"],
        "pipeline_stages_count": len(result["pipeline_stages"]),
        "workflows_count": len(result["workflows"]),
        "dashboards_count": len(result["dashboards"]),
        "forms_count": len(result["forms"]),
        "automations_count": len(result["automations"]),
        "hierarchy_tree": result["hierarchy_tree"],
        "customer_lifecycle": [s["name"] for s in result["pipeline_stages"]],
    })


@setup_wizard_bp.post("/save")
@jwt_required_custom()
def save_generated_setup():
    """Final step: Save the complete generated setup to the database."""
    data = request.get_json(force=True, silent=True) or {}
    basic_info = data.get("basic_info", {})
    analysis = data.get("analysis", {})
    employees = data.get("employees", [])
    user_id = g.current_user_id

    if not basic_info.get("company_name"):
        return error_response("Company name is required.", 400)

    try:
        from app.db import get_db
        db = get_db()

        if employees and len(employees) > 0:
            result = generate_organization_from_employees(basic_info, analysis, employees)
        else:
            result = generate_organization(basic_info, analysis)

        org_data = result["organization"]
        org_data["user_id"] = user_id
        org_data["status"] = "active"
        org_data["setup_completed"] = True
        org_data["setup_completed_at"] = datetime.utcnow().isoformat()

        org_id = db.organizations.insert_one(org_data).inserted_id

        for branch in result["branches"]:
            branch["organization_id"] = org_id
        if result["branches"]:
            db.branches.insert_many(result["branches"])

        for dept in result["departments"]:
            dept["organization_id"] = org_id
        if result["departments"]:
            db.departments.insert_many(result["departments"])

        for role in result["roles"]:
            role["organization_id"] = org_id
            for emp in role.get("employees", []):
                emp["organization_id"] = org_id
                emp["password_hash"] = "*"
            db.roles.insert_one(role)

        pipeline_doc = {
            "organization_id": org_id,
            "name": f"{result['organization']['business_type_name']} Pipeline",
            "stages": result["pipeline_stages"],
            "is_default": True,
            "created_at": datetime.utcnow().isoformat(),
        }
        db.pipeline_stages.insert_one(pipeline_doc)

        for wf in result["workflows"]:
            wf["organization_id"] = org_id
        if result["workflows"]:
            db.workflows.insert_many(result["workflows"])

        for db_conf in result["dashboards"]:
            db_conf["organization_id"] = org_id
        if result["dashboards"]:
            db.dashboards.insert_many(result["dashboards"])

        for form in result["forms"]:
            form["organization_id"] = org_id
        if result["forms"]:
            db.forms.insert_many(result["forms"])

        for auto in result["automations"]:
            auto["organization_id"] = org_id
        if result["automations"]:
            db.automations.insert_many(result["automations"])

        for perm in result["permissions"]:
            perm["organization_id"] = org_id
        if result["permissions"]:
            db.permissions.insert_many(result["permissions"])

        tmpl = BUSINESS_TEMPLATES.get(result["organization"]["business_type"],
                                       BUSINESS_TEMPLATES["custom_business"])
        wf_keys = tmpl["workflows"]
        for wk in wf_keys:
            wf_def = get_workflow_definition(wk)
            if wf_def:
                db.workflow_templates.insert_one({
                    "organization_id": org_id,
                    "name": wf_def["name"],
                    "description": wf_def["description"],
                    "category": wf_def["category"],
                    "entity_type": wf_def["entity_type"],
                    "is_built_in": True,
                    "industry": result["organization"]["business_type"],
                    "nodes": generate_default_workflow_nodes(wk),
                    "edges": generate_default_workflow_edges(wk),
                    "created_at": datetime.utcnow().isoformat(),
                })

        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "organization_id": str(org_id),
                "setup_completed": True,
                "setup_data": {
                    "company_name": basic_info.get("company_name"),
                    "business_name": basic_info.get("business_name"),
                    "business_type": result["organization"]["business_type"],
                    "business_type_name": result["organization"]["business_type_name"],
                    "completed_at": datetime.utcnow().isoformat(),
                }
            }}
        )

        return success_response({
            "organization_id": str(org_id),
            "organization_name": org_data["name"],
            "business_type": org_data["business_type"],
            "message": f"Your {org_data['business_type_name']} organization has been created successfully!",
        }, message="Organization setup complete!", status_code=201)

    except Exception as e:
        return error_response(f"Save failed: {str(e)}", 500)


def generate_default_workflow_nodes(workflow_key: str) -> list:
    nodes = [
        {"id": "start", "type": "start", "label": "Start", "position": {"x": 100, "y": 200}, "config": {}},
        {"id": "approval", "type": "approval", "label": "Approval", "position": {"x": 350, "y": 200}, "config": {"approval_type": "sequential"}},
        {"id": "notification", "type": "notification", "label": "Notify", "position": {"x": 600, "y": 200}, "config": {"channels": ["email", "in_app"]}},
        {"id": "action", "type": "assign_owner", "label": "Assign", "position": {"x": 850, "y": 200}, "config": {}},
        {"id": "end", "type": "end", "label": "Complete", "position": {"x": 1100, "y": 200}, "config": {}},
    ]

    if workflow_key in ["leave_approval", "expense_approval", "invoice_approval", "purchase_request"]:
        nodes[1]["label"] = "Manager Approval"
        nodes[2]["label"] = "Notify Requestor"
        nodes[3]["label"] = "Update Status"

    if workflow_key in ["patient_registration", "student_admission", "booking_reservation"]:
        nodes[1]["label"] = "Verify Documents"
        nodes[2]["label"] = "Send Confirmation"
        nodes[3]["label"] = "Create Record"

    if workflow_key in ["bug_reporting", "feature_request", "support_ticket"]:
        nodes[1]["label"] = "Triage"
        nodes[2]["label"] = "Notify Assignee"
        nodes[3]["label"] = "Update Tracker"

    return nodes


def generate_default_workflow_edges(workflow_key: str) -> list:
    return [
        {"id": "e1", "source": "start", "target": "approval", "label": "Submit"},
        {"id": "e2", "source": "approval", "target": "notification", "label": "Approved"},
        {"id": "e3", "source": "notification", "target": "action", "label": "Done"},
        {"id": "e4", "source": "action", "target": "end", "label": "Finish"},
    ]
