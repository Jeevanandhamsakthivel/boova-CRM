import { useState, useMemo } from "react";
import { automationApi } from "../api/automationApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination, InlineError } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/formatters";
import { getErrorMessage } from "../utils/errorUtils";
import { IconPlus, IconChevronRight, IconActivity, IconCheck } from "../components/ui/Icons";

function ZapIcon(p) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}

function AutomationToggle({ active, onChange, disabled }) {
    return (
        <div className={`automation-toggle ${active ? "active" : ""} ${disabled ? "automation-toggle-disabled" : ""}`} onClick={disabled ? undefined : onChange}>
            <div className="automation-toggle-knob" />
        </div>
    );
}

const INIT_FORM = { name: "", object_type: "lead", trigger_type: "lead_created", action_type: "assign_owner" };

export default function AutomationPage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(INIT_FORM);
    const [creating, setCreating] = useState(false);
    const [toggling, setToggling] = useState(null);

    const { items: automations, meta, loading, error, reload, updateParams } = usePaginatedList(
        automationApi.list,
        { page: 1, per_page: 20 }
    );

    const stats = useMemo(() => {
        const total = meta.total_count || 0;
        const active = automations.filter(a => a.status === "active").length;
        const inactive = automations.filter(a => a.status === "inactive").length;
        const triggerTypes = new Set(automations.map(a => (a.trigger || {}).type));
        return { total, active, inactive, triggers: triggerTypes.size };
    }, [automations, meta]);

    const triggerLabels = {
        lead_created: "Lead Created",
        lead_status_changed: "Lead Status Changed",
        deal_stage_changed: "Deal Stage Changed",
        task_completed: "Task Completed",
        invoice_paid: "Invoice Paid",
        ticket_created: "Ticket Created",
    };

    const actionLabels = {
        assign_owner: "Assign Owner",
        send_email: "Send Email",
        send_whatsapp: "Send WhatsApp",
        create_task: "Create Task",
        create_followup: "Create Follow-up",
        add_tag: "Add Tag",
        remove_tag: "Remove Tag",
        webhook: "Webhook",
        update_field: "Update Field",
        change_stage: "Change Stage",
        send_notification: "Send Notification",
        score_lead: "Score Lead",
        trigger_workflow: "Trigger Workflow",
    };

    async function handleCreate() {
        if (!form.name.trim()) {
            toast.error("Name is required.");
            return;
        }
        setCreating(true);
        try {
            await automationApi.create({
                name: form.name.trim(),
                object_type: form.object_type,
                trigger: { type: form.trigger_type, conditions: {}, delay_minutes: 0 },
                actions: [{ type: form.action_type, config: {} }],
            });
            toast.success("Automation created.");
            setShowCreate(false);
            setForm(INIT_FORM);
            reload();
        } catch (err) {
            toast.error(getErrorMessage(err) || "Failed to create automation.");
        } finally {
            setCreating(false);
        }
    }

    async function handleToggle(a) {
        setToggling(a.id);
        const newStatus = a.status === "active" ? "inactive" : "active";
        try {
            await automationApi.update(a.id, { status: newStatus });
            toast.success(`Automation ${newStatus === "active" ? "activated" : "deactivated"}.`);
            reload();
        } catch (err) {
            toast.error(getErrorMessage(err) || "Failed to update automation.");
        } finally {
            setToggling(null);
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Workflow Automation</h1>
                    <span className="page-header-subtitle">{meta.total_count} automations</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}><IconPlus width={14} height={14} /> New Automation</Button>
                </div>
            </div>

            <div className="page-stats">
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#6366F114", color: "#6366F1" }}>
                        <ZapIcon width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.total}</span>
                        <span className="page-stat-label">Total Automations</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#10B98114", color: "#10B981" }}>
                        <IconCheck width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.active}</span>
                        <span className="page-stat-label">Active</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#EF444414", color: "#EF4444" }}>
                        <IconActivity width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.inactive}</span>
                        <span className="page-stat-label">Inactive</span>
                    </div>
                </div>
                <div className="page-stat-card">
                    <div className="page-stat-icon" style={{ background: "#F59E0B14", color: "#F59E0B" }}>
                        <ZapIcon width={17} height={17} />
                    </div>
                    <div className="page-stat-body">
                        <span className="page-stat-value">{stats.triggers}</span>
                        <span className="page-stat-label">Trigger Types</span>
                    </div>
                </div>
            </div>

            {error && <InlineError message={error} onRetry={reload} />}

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : error ? null : automations.length === 0 ? (
                <div className="empty-state">
                    <ZapIcon width={40} height={40} />
                    <h3>No automations configured</h3>
                    <p>Create your first workflow automation to streamline repetitive tasks.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> New Automation</Button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {automations.map(a => (
                        <div key={a.id} className="automation-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <AutomationToggle active={a.status === "active"} onChange={() => handleToggle(a)} disabled={toggling === a.id} />
                                    <div>
                                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)", margin: 0 }}>{a.name}</h3>
                                        <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{a.object_type || "—"}</span>
                                    </div>
                                </div>
                                <StatusBadge status={a.status} />
                            </div>
                            <div className="automation-flow">
                                <div className="automation-flow-step">
                                    <ZapIcon width={14} height={14} />
                                    {triggerLabels[(a.trigger || {}).type] || (a.trigger || {}).type || "—"}
                                </div>
                                <IconChevronRight width={14} height={14} className="automation-flow-arrow" />
                                <div className="automation-flow-step">
                                    <IconActivity width={14} height={14} />
                                    {(a.actions || []).length > 0
                                        ? (a.actions || []).map(act => actionLabels[act.type] || act.type).join(", ")
                                        : "—"}
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--ink-400)" }}>
                                <span>Created {formatDate(a.created_at)}</span>
                                <span>Updated {formatDate(a.updated_at)}</span>
                                <span>{(a.actions || []).length} action(s)</span>
                            </div>
                        </div>
                    ))}
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(INIT_FORM); }} title="New Automation" maxWidth={700}>
                <div className="form-layout">
                    <div className="field-group">
                        <label className="field-label">Name <span className="required">*</span></label>
                        <input className="field-input" placeholder="e.g. New Lead Assignment" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Object Type</label>
                        <select className="field-select" value={form.object_type} onChange={e => setForm(f => ({ ...f, object_type: e.target.value }))}>
                            <option value="lead">Lead</option>
                            <option value="deal">Deal</option>
                            <option value="customer">Customer</option>
                            <option value="task">Task</option>
                            <option value="ticket">Ticket</option>
                            <option value="invoice">Invoice</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label className="field-label">Trigger Type <span className="required">*</span></label>
                        <select className="field-select" value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}>
                            <option value="lead_created">Lead Created</option>
                            <option value="lead_status_changed">Lead Status Changed</option>
                            <option value="deal_stage_changed">Deal Stage Changed</option>
                            <option value="task_completed">Task Completed</option>
                            <option value="invoice_paid">Invoice Paid</option>
                            <option value="ticket_created">Ticket Created</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label className="field-label">Action <span className="required">*</span></label>
                        <select className="field-select" value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}>
                            <option value="assign_owner">Assign Owner</option>
                            <option value="send_email">Send Email</option>
                            <option value="send_whatsapp">Send WhatsApp</option>
                            <option value="create_task">Create Task</option>
                            <option value="create_followup">Create Follow-up</option>
                            <option value="add_tag">Add Tag</option>
                            <option value="remove_tag">Remove Tag</option>
                            <option value="update_field">Update Field</option>
                            <option value="change_stage">Change Stage</option>
                            <option value="send_notification">Send Notification</option>
                            <option value="webhook">Webhook</option>
                            <option value="score_lead">Score Lead</option>
                            <option value="trigger_workflow">Trigger Workflow</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => { setShowCreate(false); setForm(INIT_FORM); }}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
