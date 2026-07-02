import { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/Button";

const STEPS = [
    { key: "basics", label: "Workflow Basics" },
    { key: "team", label: "Team & People" },
    { key: "process", label: "Process Flow" },
    { key: "generate", label: "Generate" },
];

const CATEGORIES = [
    { value: "approval", label: "Approval" },
    { value: "automation", label: "Automation" },
    { value: "notification", label: "Notification" },
    { value: "assignment", label: "Assignment" },
    { value: "employee", label: "Employee" },
    { value: "customer", label: "Customer" },
    { value: "department", label: "Department" },
];

const ENTITY_TYPES = [
    { value: "lead", label: "Lead" },
    { value: "customer", label: "Customer" },
    { value: "deal", label: "Deal" },
    { value: "task", label: "Task" },
    { value: "ticket", label: "Ticket" },
    { value: "user", label: "User" },
    { value: "invoice", label: "Invoice" },
    { value: "quote", label: "Quote" },
    { value: "company", label: "Company" },
    { value: "contact", label: "Contact" },
];

const INVOLVEMENT_OPTIONS = [
    { value: "1-5", label: "1–5 people" },
    { value: "5-20", label: "5–20 people" },
    { value: "20+", label: "20+ people" },
];

const INITIATOR_OPTIONS = [
    { value: "employee", label: "Employee" },
    { value: "manager", label: "Manager" },
    { value: "customer", label: "Customer" },
    { value: "system", label: "System (automated)" },
];

const APPROVER_OPTIONS = [
    { value: "none", label: "No approval needed" },
    { value: "manager", label: "Direct Manager" },
    { value: "dept_head", label: "Department Head" },
    { value: "admin", label: "Admin" },
    { value: "multi", label: "Multiple approvers (sequential)" },
];

const TRIGGER_OPTIONS = [
    { value: "created", label: "Record is created" },
    { value: "updated", label: "Record is updated" },
    { value: "scheduled", label: "Scheduled (daily/weekly)" },
    { value: "manual", label: "Manual trigger" },
];

const ACTION_OPTIONS = [
    { value: "notify", label: "Send a notification" },
    { value: "task", label: "Create a task" },
    { value: "email", label: "Send an email" },
    { value: "update", label: "Update a record" },
    { value: "assign", label: "Assign a record" },
    { value: "multi", label: "Multiple actions" },
];

const DEPARTMENTS = [
    "Sales", "Marketing", "Support", "Engineering",
    "HR", "Finance", "Operations", "Legal",
];

const TASK_TYPES = [
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "meeting", label: "Meeting" },
    { value: "followup", label: "Follow-up" },
    { value: "review", label: "Review" },
    { value: "demo", label: "Demo" },
];

const NOTIFICATION_CHANNELS = [
    { value: "in_app", label: "In-App" },
    { value: "email", label: "Email" },
    { value: "whatsapp", label: "WhatsApp" },
];

function generateId() {
    return `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function edgeId() {
    return `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateWorkflowGraph(data) {
    const nodes = [];
    const edges = [];
    const startId = generateId();
    const endId = generateId();
    let prevId = startId;

    nodes.push({
        id: startId,
        type: "start",
        label: "Start",
        position: { x: 60, y: 220 },
        config: {},
    });

    const hasApproval = data.approval !== "none";

    if (data.trigger === "created" || data.trigger === "updated") {
        const updateId = generateId();
        nodes.push({
            id: updateId,
            type: "update_record",
            label: `Wait for ${data.trigger === "created" ? "Creation" : "Update"}`,
            position: { x: 260, y: 220 },
            config: {
                status: data.trigger === "created" ? "new" : "updated",
                field: data.entity_type || "record",
            },
        });
        edges.push({ id: edgeId(), source: startId, target: updateId });
        prevId = updateId;
    }

    if (data.action === "assign" || data.action === "multi") {
        const assignId = generateId();
        nodes.push({
            id: assignId,
            type: "assign_owner",
            label: `Assign to ${data.department || "Team"}`,
            position: { x: prevId === startId ? 260 : 460, y: prevId === startId ? 220 : 160 },
            config: {
                assignment_type: data.involvement === "1-5" ? "direct" : "round_robin",
                department: data.department || "",
                team: data.department || "",
            },
        });
        edges.push({ id: edgeId(), source: prevId, target: assignId });
        prevId = assignId;
    }

    if (data.action === "task" || data.action === "multi") {
        const taskId = generateId();
        nodes.push({
            id: taskId,
            type: "create_task",
            label: `Create ${data.task_type || "followup"} task`,
            position: { x: prevId === startId ? 260 : 460, y: prevId === startId ? 220 : 160 },
            config: {
                task_type: data.task_type || "followup",
                priority: data.involvement === "1-5" ? "high" : "medium",
                title_template: `{{entity.name}} - ${data.name}`,
                description: `Auto-generated from ${data.name}`,
                assign_to: data.initiator === "employee" ? "creator" : "role",
                due_days: 3,
            },
        });
        edges.push({ id: edgeId(), source: prevId, target: taskId });
        prevId = taskId;
    }

    if (data.action === "notify" || data.action === "multi") {
        const notifId = generateId();
        const channels = data.notification_channels || ["in_app"];
        nodes.push({
            id: notifId,
            type: "notification",
            label: `Notify ${data.notify_role || "Team"}`,
            position: { x: prevId === startId ? 260 : 460, y: prevId === startId ? 220 : 160 },
            config: {
                channels,
                title: `New: ${data.name}`,
                message: data.notification_message || `A new ${data.entity_type} requires attention.`,
            },
        });
        edges.push({ id: edgeId(), source: prevId, target: notifId });
        prevId = notifId;
    }

    if (data.action === "email" || data.action === "multi") {
        const emailId = generateId();
        nodes.push({
            id: emailId,
            type: "email",
            label: "Send Email",
            position: { x: prevId === startId ? 260 : 460, y: prevId === startId ? 220 : 160 },
            config: {
                template: "standard",
                subject: data.name,
                to_field: data.initiator === "customer" ? "customer" : "assigned_user",
            },
        });
        edges.push({ id: edgeId(), source: prevId, target: emailId });
        prevId = emailId;
    }

    if (data.action === "update" || data.action === "multi") {
        const updateRecId = generateId();
        nodes.push({
            id: updateRecId,
            type: "update_record",
            label: "Update Record Status",
            position: { x: prevId === startId ? 260 : 460, y: prevId === startId ? 220 : 160 },
            config: {
                field: "status",
                value: "in_review",
                status: "in_review",
            },
        });
        edges.push({ id: edgeId(), source: prevId, target: updateRecId });
        prevId = updateRecId;
    }

    if (hasApproval) {
        const conditionId = generateId();
        const approvalId = generateId();
        const rejectId = generateId();

        nodes.push({
            id: conditionId,
            type: "condition",
            label: "Needs Approval?",
            position: { x: 460, y: 220 },
            config: {
                field: "status",
                operator: "equals",
                value: "pending_approval",
            },
        });
        edges.push({ id: edgeId(), source: prevId, target: conditionId, label: "Check" });
        prevId = conditionId;

        const approverRole = data.approval === "admin" ? "admin"
            : data.approval === "dept_head" ? "manager"
            : data.approval === "multi" ? "manager"
            : "manager";

        nodes.push({
            id: approvalId,
            type: "approval",
            label: data.approval === "multi" ? "Sequential Approval" : `${approverRole.charAt(0).toUpperCase() + approverRole.slice(1)} Approval`,
            position: { x: 660, y: 120 },
            config: {
                approval_type: data.approval === "multi" ? "sequential" : "single",
                required_approvers: data.approval === "multi" ? 2 : 1,
                assign_to_role: approverRole,
                escalation_minutes: data.involvement === "20+" ? 120 : 60,
                allow_reminder: true,
                allow_rework: true,
            },
        });

        nodes.push({
            id: rejectId,
            type: "reject",
            label: "Rejected",
            position: { x: 660, y: 340 },
            config: {},
        });

        edges.push({ id: edgeId(), source: conditionId, target: approvalId, label: "Yes" });
        edges.push({ id: edgeId(), source: conditionId, target: rejectId, label: "No" });
        prevId = approvalId;

        const notifyApprovedId = generateId();
        nodes.push({
            id: notifyApprovedId,
            type: "notification",
            label: "Notify: Approved",
            position: { x: 860, y: 120 },
            config: {
                channels: ["in_app", "email"],
                title: "Approved",
                message: `The request has been approved.`,
            },
        });
        edges.push({ id: edgeId(), source: approvalId, target: notifyApprovedId, label: "Approved" });

        const notifyRejectedId = generateId();
        nodes.push({
            id: notifyRejectedId,
            type: "notification",
            label: "Notify: Rejected",
            position: { x: 860, y: 340 },
            config: {
                channels: ["in_app", "email"],
                title: "Rejected",
                message: `The request was not approved.`,
            },
        });
        edges.push({ id: edgeId(), source: rejectId, target: notifyRejectedId, label: "Rejected" });

        const mergeId = generateId();
        nodes.push({
            id: mergeId,
            type: "merge",
            label: "Merge",
            position: { x: 1060, y: 220 },
            config: {},
        });
        edges.push({ id: edgeId(), source: notifyApprovedId, target: mergeId });
        edges.push({ id: edgeId(), source: notifyRejectedId, target: mergeId });
        prevId = mergeId;
    }

    nodes.push({
        id: endId,
        type: "end",
        label: "End",
        position: { x: prevId === startId ? 260 : prevId.includes("merge") ? 1260 : prevId.includes("notify") && !hasApproval ? 660 : 660, y: hasApproval ? 220 : 220 },
        config: {},
    });
    edges.push({ id: edgeId(), source: prevId, target: endId });

    return { nodes, edges };
}

export default function WorkflowSetupWizard({ onGenerate, onClose }) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        name: "",
        description: "",
        category: "approval",
        entity_type: "lead",
        involvement: "1-5",
        initiator: "employee",
        approval: "manager",
        department: "Sales",
        trigger: "created",
        action: "notify",
        task_type: "followup",
        notification_channels: ["in_app"],
        notify_role: "manager",
        notification_message: "",
    });

    const update = useCallback((key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
    }, []);

    const canProceed = useMemo(() => {
        if (step === 0) return data.name.trim().length >= 2;
        return true;
    }, [step, data.name]);

    const handleGenerate = useCallback(() => {
        const graph = generateWorkflowGraph(data);
        onGenerate({
            ...data,
            nodes: graph.nodes,
            edges: graph.edges,
        });
    }, [data, onGenerate]);

    const isLastStep = step === STEPS.length - 1;

    return (
        <div className="wf-setup-overlay">
            <div className="wf-setup-modal">
                <div className="wf-setup-sidebar">
                    <div className="wf-setup-sidebar-title">Workflow Setup</div>
                    <div className="wf-setup-steps">
                        {STEPS.map((s, i) => (
                            <div
                                key={s.key}
                                className={`wf-setup-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
                                onClick={() => i < step && setStep(i)}
                            >
                                <div className="wf-setup-step-num">{i < step ? "✓" : i + 1}</div>
                                <div className="wf-setup-step-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="wf-setup-main">
                    <div className="wf-setup-content">
                        {step === 0 && (
                            <div className="wf-setup-form">
                                <h3>What should this workflow do?</h3>
                                <p className="wf-setup-hint">Give it a clear name so your team knows what it's for.</p>

                                <div className="field-group">
                                    <label className="field-label">Workflow Name *</label>
                                    <input className="field-input" placeholder="e.g. Leave Approval Request" value={data.name}
                                        onChange={e => update("name", e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && canProceed && setStep(1)}
                                        autoFocus
                                    />
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Description</label>
                                    <textarea className="field-input field-textarea" rows={3}
                                        placeholder="What does this workflow automate?"
                                        value={data.description}
                                        onChange={e => update("description", e.target.value)}
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div className="field-group">
                                        <label className="field-label">Category</label>
                                        <select className="field-select" value={data.category}
                                            onChange={e => update("category", e.target.value)}>
                                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Applies To</label>
                                        <select className="field-select" value={data.entity_type}
                                            onChange={e => update("entity_type", e.target.value)}>
                                            {ENTITY_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="wf-setup-form">
                                <h3>Who's involved?</h3>
                                <p className="wf-setup-hint">Tell us about the people and roles in this workflow.</p>

                                <div className="field-group">
                                    <label className="field-label">How many people are involved?</label>
                                    <div className="wf-setup-options">
                                        {INVOLVEMENT_OPTIONS.map(o => (
                                            <button key={o.value}
                                                className={`wf-setup-option ${data.involvement === o.value ? "selected" : ""}`}
                                                onClick={() => update("involvement", o.value)}
                                            >{o.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Who initiates this workflow?</label>
                                    <div className="wf-setup-options">
                                        {INITIATOR_OPTIONS.map(o => (
                                            <button key={o.value}
                                                className={`wf-setup-option ${data.initiator === o.value ? "selected" : ""}`}
                                                onClick={() => update("initiator", o.value)}
                                            >{o.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Who needs to approve?</label>
                                    <div className="wf-setup-options">
                                        {APPROVER_OPTIONS.map(o => (
                                            <button key={o.value}
                                                className={`wf-setup-option ${data.approval === o.value ? "selected" : ""}`}
                                                onClick={() => update("approval", o.value)}
                                            >{o.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div className="field-group">
                                        <label className="field-label">Department</label>
                                        <select className="field-select" value={data.department}
                                            onChange={e => update("department", e.target.value)}>
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="wf-setup-form">
                                <h3>How should it work?</h3>
                                <p className="wf-setup-hint">Define the trigger, actions, and notifications.</p>

                                <div className="field-group">
                                    <label className="field-label">What triggers this workflow?</label>
                                    <div className="wf-setup-options">
                                        {TRIGGER_OPTIONS.map(o => (
                                            <button key={o.value}
                                                className={`wf-setup-option ${data.trigger === o.value ? "selected" : ""}`}
                                                onClick={() => update("trigger", o.value)}
                                            >{o.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">What action should happen?</label>
                                    <div className="wf-setup-options">
                                        {ACTION_OPTIONS.map(o => (
                                            <button key={o.value}
                                                className={`wf-setup-option ${data.action === o.value ? "selected" : ""}`}
                                                onClick={() => update("action", o.value)}
                                            >{o.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {data.action === "task" && (
                                    <div className="field-group">
                                        <label className="field-label">Task Type</label>
                                        <select className="field-select" value={data.task_type}
                                            onChange={e => update("task_type", e.target.value)}>
                                            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                )}

                                {(data.action === "notify" || data.action === "multi") && (
                                    <>
                                        <div className="field-group">
                                            <label className="field-label">Notification Channels</label>
                                            <div className="wf-setup-options">
                                                {NOTIFICATION_CHANNELS.map(c => (
                                                    <button key={c.value}
                                                        className={`wf-setup-option ${data.notification_channels.includes(c.value) ? "selected" : ""}`}
                                                        onClick={() => {
                                                            const next = data.notification_channels.includes(c.value)
                                                                ? data.notification_channels.filter(x => x !== c.value)
                                                                : [...data.notification_channels, c.value];
                                                            update("notification_channels", next.length ? next : ["in_app"]);
                                                        }}
                                                    >{c.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="field-group">
                                            <label className="field-label">Notify Role</label>
                                            <select className="field-select" value={data.notify_role}
                                                onChange={e => update("notify_role", e.target.value)}>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                                <option value="department">Department</option>
                                                <option value="assignee">Assignee</option>
                                            </select>
                                        </div>
                                        <div className="field-group">
                                            <label className="field-label">Notification Message</label>
                                            <textarea className="field-input field-textarea" rows={2}
                                                placeholder="What should the notification say?"
                                                value={data.notification_message}
                                                onChange={e => update("notification_message", e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="wf-setup-form">
                                <h3>Ready to generate</h3>
                                <p className="wf-setup-hint">Review your workflow configuration before generating.</p>

                                <div className="wf-setup-summary">
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Workflow</span>
                                        <span className="wf-setup-summary-value">{data.name}</span>
                                    </div>
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Category</span>
                                        <span className="wf-setup-summary-value">{CATEGORIES.find(c => c.value === data.category)?.label}</span>
                                    </div>
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Entity</span>
                                        <span className="wf-setup-summary-value">{ENTITY_TYPES.find(e => e.value === data.entity_type)?.label}</span>
                                    </div>
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Department</span>
                                        <span className="wf-setup-summary-value">{data.department}</span>
                                    </div>
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Initiator</span>
                                        <span className="wf-setup-summary-value">{INITIATOR_OPTIONS.find(o => o.value === data.initiator)?.label}</span>
                                    </div>
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Approval</span>
                                        <span className="wf-setup-summary-value">{APPROVER_OPTIONS.find(o => o.value === data.approval)?.label}</span>
                                    </div>
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Trigger</span>
                                        <span className="wf-setup-summary-value">{TRIGGER_OPTIONS.find(o => o.value === data.trigger)?.label}</span>
                                    </div>
                                    <div className="wf-setup-summary-row">
                                        <span className="wf-setup-summary-label">Action</span>
                                        <span className="wf-setup-summary-value">{ACTION_OPTIONS.find(o => o.value === data.action)?.label}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="wf-setup-footer">
                        <Button variant="secondary" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
                            {step === 0 ? "Cancel" : "Back"}
                        </Button>
                        {isLastStep ? (
                            <Button onClick={handleGenerate}>Generate Workflow</Button>
                        ) : (
                            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}>
                                Continue
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
