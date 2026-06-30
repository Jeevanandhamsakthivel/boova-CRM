import { useRef } from "react";
import { StatusBadge } from "../ui/Badge";
import { IconMail, IconPhone, IconBuilding, IconEdit, IconPlus } from "../ui/Icons";
import { formatCurrency } from "../../utils/formatters";
import { useInlineEdit } from "../../hooks/useInlineEdit";

const STATUS_OPTIONS = [
    { value: "active",   label: "Active"   },
    { value: "inactive", label: "Inactive" },
    { value: "churned",  label: "Churned"  },
];

/* ── Inline-editable field ─────────────────────────────── */
function InlineField({ label, value, fieldKey, type = "text", options, editState, canWrite, large }) {
    const { editingField, draftValue, setDraftValue, saving, fieldError, startEdit, cancelEdit, saveEdit } = editState;
    const isEditing = editingField === fieldKey;
    const inputRef = useRef(null);

    function handleKeyDown(e) {
        if (e.key === "Enter") saveEdit(fieldKey, draftValue);
        if (e.key === "Escape") cancelEdit();
    }

    function handleBlur() {
        if (draftValue !== (value ?? "")) saveEdit(fieldKey, draftValue);
        else cancelEdit();
    }

    if (isEditing) {
        return (
            <div className="ws-inline-field editing">
                {options ? (
                    <select
                        className="field-select-sm"
                        autoFocus
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        disabled={saving}
                    >
                        {options.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        ref={inputRef}
                        className="field-input-sm"
                        autoFocus
                        type={type}
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        disabled={saving}
                        style={large ? { fontSize: 18, minWidth: 220 } : {}}
                    />
                )}
                {fieldError && <span className="field-error" style={{ fontSize: 11 }}>{fieldError}</span>}
            </div>
        );
    }

    return (
        <span
            className={`ws-inline-field${canWrite ? " editable" : ""}`}
            onClick={() => canWrite && startEdit(fieldKey, value ?? "")}
            title={canWrite ? `Click to edit ${label}` : undefined}
        >
            <span className="ws-field-value" style={large ? { fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--ink-900)", letterSpacing: "-0.02em" } : {}}>
                {value || <span className="ws-field-empty">—</span>}
            </span>
            {canWrite && <IconEdit width={11} height={11} className="ws-edit-icon" />}
        </span>
    );
}

/* ── KPI pill ──────────────────────────────────────────── */
function KpiItem({ value, label, accent }) {
    return (
        <div className="ws-kpi">
            <span className="ws-kpi-value" style={accent ? { color: accent } : undefined}>{value}</span>
            <span className="ws-kpi-label">{label}</span>
        </div>
    );
}

/* ── Quick action button ───────────────────────────────── */
function QuickBtn({ icon, label, shortcut, onClick }) {
    return (
        <button className="ws-quick-btn" onClick={onClick} title={`${label} (${shortcut.toUpperCase()})`}>
            {icon}
            {label}
            <span className="ws-shortcut">{shortcut.toUpperCase()}</span>
        </button>
    );
}

/* ── WorkspaceHeader ───────────────────────────────────── */
export function WorkspaceHeader({ customer, summary, canWrite, onAction }) {
    const editState = useInlineEdit(customer.id, onAction.onCustomerSaved);

    return (
        <div className="ws-header">
            {/* Identity + KPIs row */}
            <div className="ws-header-body">
                {/* Left: avatar + fields */}
                <div className="ws-header-identity">
                    <div className="ws-avatar">
                        {(customer.name || "?").slice(0, 2).toUpperCase()}
                    </div>

                    <div className="ws-header-main">
                        {/* Name + status */}
                        <div className="ws-name-row">
                            <InlineField
                                label="Name"
                                value={customer.name}
                                fieldKey="name"
                                editState={editState}
                                canWrite={canWrite}
                                large
                            />
                            <StatusBadge status={customer.status} />
                        </div>

                        {/* Meta row */}
                        <div className="ws-header-meta">
                            <span className="ws-meta-item">
                                <IconBuilding width={13} height={13} />
                                <InlineField label="Company" value={customer.company} fieldKey="company" editState={editState} canWrite={canWrite} />
                            </span>
                            <span className="ws-meta-item">
                                <IconMail width={13} height={13} />
                                <InlineField label="Email" value={customer.email} fieldKey="email" type="email" editState={editState} canWrite={canWrite} />
                            </span>
                            <span className="ws-meta-item">
                                <IconPhone width={13} height={13} />
                                <InlineField label="Phone" value={customer.phone} fieldKey="phone" type="tel" editState={editState} canWrite={canWrite} />
                            </span>
                            {customer.mobile && (
                                <span className="ws-meta-item">
                                    <span className="ws-meta-label">Mobile</span>
                                    <InlineField label="Mobile" value={customer.mobile} fieldKey="mobile" type="tel" editState={editState} canWrite={canWrite} />
                                </span>
                            )}
                            {customer.job_title && (
                                <span className="ws-meta-item">
                                    <span className="ws-meta-label">Title</span>
                                    <InlineField label="Job Title" value={customer.job_title} fieldKey="job_title" editState={editState} canWrite={canWrite} />
                                </span>
                            )}
                            {customer.industry && (
                                <span className="ws-meta-item">
                                    <span className="ws-meta-label">Industry</span>
                                    <span className="ws-field-value">{customer.industry.split("_").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ")}</span>
                                </span>
                            )}
                            <span className="ws-meta-item">
                                <span className="ws-meta-label">Owner</span>
                                <InlineField label="Assigned To" value={customer.assigned_to} fieldKey="assigned_to" editState={editState} canWrite={canWrite} />
                            </span>
                            <span className="ws-meta-item">
                                <span className="ws-meta-label">Status</span>
                                <InlineField label="Status" value={customer.status} fieldKey="status" options={STATUS_OPTIONS} editState={editState} canWrite={canWrite} />
                            </span>
                            {customer.website && (
                                <span className="ws-meta-item">
                                    <span className="ws-meta-label">Web</span>
                                    <a href={customer.website} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"var(--accent-strong)" }}>{customer.website}</a>
                                </span>
                            )}
                        </div>

                        {customer.tags?.length > 0 && (
                            <div className="ws-tags">
                                {customer.tags.map((tag) => (
                                    <span key={tag} className="badge badge-neutral">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: KPI strip */}
                <div className="ws-header-kpis">
                    <div className="ws-kpi-row">
                        <KpiItem value={formatCurrency(customer.lifetime_value)} label="Lifetime Value" accent="var(--success)" />
                        {summary && (
                            <>
                                <KpiItem value={summary.open_tasks_count}       label="Open Tasks" />
                                <KpiItem value={summary.active_deals_count}     label="Active Deals" />
                                <KpiItem value={summary.pending_followups_count} label="Pending Follow-ups" />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick actions bar */}
            {canWrite && (
                <div className="ws-quick-actions">
                    <span className="ws-quick-actions-label">Quick add</span>
                    <QuickBtn
                        icon={<IconPlus width={13} height={13} />}
                        label="Note"
                        shortcut="n"
                        onClick={() => onAction.openPanel("note")}
                    />
                    <QuickBtn
                        icon={<IconPlus width={13} height={13} />}
                        label="Task"
                        shortcut="t"
                        onClick={() => onAction.openPanel("task")}
                    />
                    <QuickBtn
                        icon={<IconPlus width={13} height={13} />}
                        label="Deal"
                        shortcut="d"
                        onClick={() => onAction.openPanel("deal")}
                    />
                    <QuickBtn
                        icon={<IconPlus width={13} height={13} />}
                        label="Follow-up"
                        shortcut="f"
                        onClick={() => onAction.openPanel("followup")}
                    />
                </div>
            )}
        </div>
    );
}
