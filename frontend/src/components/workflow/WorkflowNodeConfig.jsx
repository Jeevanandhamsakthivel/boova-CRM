import { useState, useEffect, useCallback } from "react";

const CONFIG_FIELDS = {
    approval: [
        { key: "approval_type", label: "Approval Type", type: "select", options: ["single", "sequential", "parallel", "delegated"] },
        { key: "required_approvers", label: "Required Approvers", type: "number", default: 1 },
        { key: "assign_to_role", label: "Assign to Role", type: "select", options: ["admin", "manager", "agent"] },
        { key: "escalation_minutes", label: "Escalation (minutes)", type: "number", default: 60 },
        { key: "allow_reminder", label: "Allow Reminder", type: "boolean", default: true },
        { key: "allow_rework", label: "Allow Rework", type: "boolean", default: false },
    ],
    assign_owner: [
        { key: "assignment_type", label: "Assignment Type", type: "select", options: ["direct", "round_robin", "least_busy", "manager", "ai"] },
        { key: "team", label: "Team", type: "text" },
        { key: "department", label: "Department", type: "text" },
        { key: "user_id", label: "User ID", type: "text" },
    ],
    transfer_owner: [
        { key: "transfer_to_role", label: "Transfer to Role", type: "select", options: ["admin", "manager", "agent"] },
        { key: "transfer_to_department", label: "Department", type: "text" },
        { key: "notify_previous", label: "Notify Previous Owner", type: "boolean", default: true },
    ],
    notification: [
        { key: "channels", label: "Channels", type: "multiselect", options: ["email", "whatsapp", "sms", "in_app"] },
        { key: "template", label: "Template", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "message", label: "Message", type: "textarea" },
    ],
    email: [
        { key: "template", label: "Email Template", type: "text" },
        { key: "subject", label: "Subject", type: "text" },
        { key: "to_field", label: "Send To", type: "select", options: ["customer", "lead", "assigned_user", "custom"] },
        { key: "custom_email", label: "Custom Email", type: "text" },
    ],
    whatsapp: [
        { key: "template", label: "WhatsApp Template", type: "text" },
        { key: "message", label: "Message", type: "textarea" },
    ],
    sms: [
        { key: "message", label: "SMS Message", type: "textarea" },
        { key: "phone_field", label: "Phone Field", type: "select", options: ["mobile", "phone", "whatsapp"] },
    ],
    create_task: [
        { key: "task_type", label: "Task Type", type: "select", options: ["call", "email", "meeting", "demo", "followup", "production", "documentation", "assignment", "planning", "review", "other"] },
        { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high", "urgent"] },
        { key: "title_template", label: "Title Template", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "assign_to", label: "Assign To", type: "select", options: ["creator", "customer_owner", "role", "custom"] },
        { key: "due_days", label: "Due In (days)", type: "number", default: 3 },
    ],
    update_record: [
        { key: "field", label: "Field to Update", type: "text" },
        { key: "value", label: "Value", type: "text" },
        { key: "status", label: "Set Status", type: "text" },
    ],
    generate_document: [
        { key: "document_type", label: "Document Type", type: "select", options: ["quote", "invoice", "contract", "report", "letter"] },
        { key: "template", label: "Template", type: "text" },
    ],
    webhook: [
        { key: "url", label: "Webhook URL", type: "text" },
        { key: "method", label: "Method", type: "select", options: ["GET", "POST", "PUT", "PATCH"] },
        { key: "headers", label: "Headers (JSON)", type: "textarea" },
    ],
    rest_api: [
        { key: "url", label: "API URL", type: "text" },
        { key: "method", label: "Method", type: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
        { key: "body", label: "Request Body (JSON)", type: "textarea" },
        { key: "response_map", label: "Response Mapping (JSON)", type: "textarea" },
    ],
    ai_decision: [
        { key: "prompt", label: "AI Prompt", type: "textarea" },
        { key: "model", label: "Model", type: "text" },
        { key: "output_field", label: "Output Field", type: "text" },
        { key: "conditions", label: "Decision Conditions (JSON)", type: "textarea" },
    ],
    wait: [
        { key: "duration_minutes", label: "Duration (minutes)", type: "number", default: 60 },
        { key: "wait_until_field", label: "Wait Until Date Field", type: "text" },
    ],
    condition: [
        { key: "field", label: "Field to Evaluate", type: "text" },
        { key: "operator", label: "Operator", type: "select", options: ["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"] },
        { key: "value", label: "Value", type: "text" },
    ],
};

export function WorkflowNodeConfig({ node, onChange, onClose }) {
    const [config, setConfig] = useState({});
    const [label, setLabel] = useState("");

    useEffect(() => {
        if (node) {
            setConfig(node.config || {});
            setLabel(node.label || "");
        } else {
            setConfig({});
            setLabel("");
        }
    }, [node]);

    const updateConfig = useCallback((key, value) => {
        const next = { ...config, [key]: value };
        setConfig(next);
        onChange(node.id, next, label);
    }, [config, node, onChange, label]);

    const updateLabel = useCallback((value) => {
        setLabel(value);
        onChange(node.id, config, value);
    }, [config, node, onChange]);

    if (!node) {
        return (
            <div className="wf-config-panel">
                <div className="wf-config-header">
                    <span>Properties</span>
                </div>
                <div className="wf-config-body">
                    <div className="wf-config-empty">Select a node to configure</div>
                </div>
            </div>
        );
    }

    const fields = CONFIG_FIELDS[node.type] || [];

    function renderField(field) {
        const val = config[field.key] ?? field.default ?? "";
        switch (field.type) {
            case "select":
                return (
                    <select className="field-select" value={val} onChange={e => updateConfig(field.key, e.target.value)}>
                        <option value="">Select...</option>
                        {field.options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                    </select>
                );
            case "multiselect":
                const selected = Array.isArray(val) ? val : [];
                return (
                    <div className="wf-config-multiselect">
                        {field.options.map(opt => (
                            <label key={opt} className="wf-config-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(opt)}
                                    onChange={e => {
                                        const next = e.target.checked
                                            ? [...selected, opt]
                                            : selected.filter(s => s !== opt);
                                        updateConfig(field.key, next);
                                    }}
                                />
                                {opt.replace(/_/g, " ")}
                            </label>
                        ))}
                    </div>
                );
            case "boolean":
                return (
                    <label className="wf-config-checkbox">
                        <input type="checkbox" checked={!!val} onChange={e => updateConfig(field.key, e.target.checked)} />
                        Enabled
                    </label>
                );
            case "number":
                return (
                    <input className="field-input" type="number" value={val} onChange={e => updateConfig(field.key, parseInt(e.target.value) || 0)} />
                );
            case "textarea":
                return (
                    <textarea className="field-input field-textarea" value={val} onChange={e => updateConfig(field.key, e.target.value)} rows={3} />
                );
            default:
                return (
                    <input className="field-input" value={val} onChange={e => updateConfig(field.key, e.target.value)} />
                );
        }
    }

    return (
        <div className="wf-config-panel">
            <div className="wf-config-header">
                <span>{node.label || node.type.replace(/_/g, " ")}</span>
                <button className="wf-config-close" onClick={onClose}>×</button>
            </div>
            <div className="wf-config-body">
                <div className="field-group">
                    <label className="field-label">Label</label>
                    <input className="field-input" value={label} onChange={e => updateLabel(e.target.value)} />
                </div>
                {fields.length > 0 ? (
                    fields.map(field => (
                        <div key={field.key} className="field-group">
                            <label className="field-label">{field.label}</label>
                            {renderField(field)}
                        </div>
                    ))
                ) : (
                    <div className="wf-config-no-fields">No configuration required for this node.</div>
                )}
            </div>
        </div>
    );
}
