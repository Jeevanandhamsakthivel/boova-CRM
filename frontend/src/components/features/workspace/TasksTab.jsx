import { useState } from "react";
import { tasksApi } from "../../../api/tasksApi";
import { useTabLoad } from "../../../hooks/useTabLoad";
import { StatusBadge } from "../../ui/Badge";
import { Spinner } from "../../ui/Misc";
import { formatDate } from "../../../utils/formatters";
import { getErrorMessage } from "../../../utils/errorUtils";
import { useToast } from "../../../context/ToastContext";
import { IconChevronDown, IconChevronRight } from "../../ui/Icons";

const STATUS_CYCLE = { todo: "in_progress", in_progress: "completed", completed: "todo" };

const PRIORITY_COLORS = {
    low:    "var(--ink-200)",
    medium: "var(--accent)",
    high:   "var(--warning)",
    urgent: "var(--danger)",
};

function TaskRow({ task, onStatusCycle }) {
    const [cycling, setCycling] = useState(false);

    async function handleStatusClick(e) {
        e.stopPropagation();
        if (cycling) return;
        const next = STATUS_CYCLE[task.status] || "todo";
        setCycling(true);
        await onStatusCycle(task, next);
        setCycling(false);
    }

    const isCompleted = ["completed", "cancelled"].includes(task.status);

    return (
        <div className="ws-list-row" style={isCompleted ? { opacity: 0.6 } : undefined}>
            {/* Priority stripe */}
            <div style={{
                width: 3,
                alignSelf: "stretch",
                borderRadius: 2,
                background: PRIORITY_COLORS[task.priority] || "var(--border-hairline)",
                flexShrink: 0,
            }} />

            <div className="ws-list-row-main">
                <span className="ws-list-title" style={isCompleted ? { textDecoration: "line-through" } : undefined}>
                    {task.title}
                </span>
                <div className="ws-list-meta">
                    <button
                        className="badge-btn"
                        onClick={handleStatusClick}
                        disabled={cycling}
                        title="Click to advance status"
                    >
                        <StatusBadge status={task.status} />
                    </button>
                    <StatusBadge status={task.priority} />
                    {task.due_date && (
                        <>
                            <span className="ws-meta-sep" />
                            <span className="ws-meta-text">Due {formatDate(task.due_date)}</span>
                        </>
                    )}
                    {task.assigned_to && (
                        <>
                            <span className="ws-meta-sep" />
                            <span className="ws-meta-text">{task.assigned_to}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ label, count, collapsed, onToggle }) {
    return (
        <div className="ws-section-header">
            <span>{label} <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>({count})</span></span>
            <button
                className="btn btn-ghost btn-sm"
                onClick={onToggle}
                aria-expanded={!collapsed}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 6px" }}
            >
                {collapsed ? <IconChevronRight width={14} height={14} /> : <IconChevronDown width={14} height={14} />}
            </button>
        </div>
    );
}

export function TasksTab({ customerId, activeTab }) {
    const toast = useToast();
    const { items, setItems, loading, error, reload } = useTabLoad(
        "tasks",
        activeTab,
        () => tasksApi.list({ related_to_id: customerId, per_page: 100 })
    );

    const [showCompleted, setShowCompleted] = useState(false);

    const open      = items.filter((t) => ["todo", "in_progress"].includes(t.status));
    const completed = items.filter((t) => ["completed", "cancelled"].includes(t.status));

    async function handleStatusCycle(task, nextStatus) {
        setItems((prev) => prev.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t));
        try {
            await tasksApi.update(task.id, { status: nextStatus });
        } catch (err) {
            setItems((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
            toast.error(getErrorMessage(err));
        }
    }

    if (loading) return <div className="ws-tab-loading"><Spinner /></div>;
    if (error)   return (
        <div className="ws-tab-error">
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={reload}>Retry</button>
        </div>
    );

    return (
        <div className="ws-tab-content">
            {/* Open section */}
            <div className="ws-section">
                <SectionHeader label="Open" count={open.length} collapsed={false} onToggle={() => {}} />
                <div className="ws-list">
                    {open.length === 0 ? (
                        <div className="ws-empty-msg">No open tasks — all caught up.</div>
                    ) : (
                        open.map((t) => (
                            <TaskRow key={t.id} task={t} onStatusCycle={handleStatusCycle} />
                        ))
                    )}
                </div>
            </div>

            {/* Completed section */}
            <div className="ws-section">
                <SectionHeader
                    label="Completed"
                    count={completed.length}
                    collapsed={!showCompleted}
                    onToggle={() => setShowCompleted((v) => !v)}
                />
                {showCompleted && (
                    <div className="ws-list">
                        {completed.length === 0 ? (
                            <div className="ws-empty-msg">No completed tasks yet.</div>
                        ) : (
                            completed.map((t) => (
                                <TaskRow key={t.id} task={t} onStatusCycle={handleStatusCycle} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
