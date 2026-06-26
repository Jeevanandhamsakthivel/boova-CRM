import { titleCase } from "../../utils/formatters";

const STATUS_VARIANTS = {
    // Lead statuses
    new: "info",
    contacted: "accent",
    qualified: "success",
    unqualified: "neutral",
    converted: "success",
    lost: "danger",
    // Customer statuses
    active: "success",
    inactive: "neutral",
    churned: "danger",
    // Task / followup statuses
    todo: "neutral",
    pending: "warning",
    in_progress: "accent",
    completed: "success",
    cancelled: "neutral",
    overdue: "danger",
    // Deal statuses
    open: "info",
    won: "success",
    // Priorities
    low: "neutral",
    medium: "accent",
    high: "warning",
    urgent: "danger",
};

export function StatusBadge({ status, label }) {
    const variant = STATUS_VARIANTS[status] || "neutral";
    return <span className={`badge badge-${variant}`}>{label || titleCase(status)}</span>;
}

export function TemperatureDot({ qualification }) {
    if (!qualification) return null;
    return <span className={`temp-dot temp-${qualification}`} title={titleCase(qualification)} />;
}

export function Badge({ variant = "neutral", children }) {
    return <span className={`badge badge-${variant}`}>{children}</span>;
}