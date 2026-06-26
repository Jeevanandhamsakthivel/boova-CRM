import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function formatDate(value, pattern = "MMM d, yyyy") {
    if (!value) return "—";
    const date = typeof value === "string" ? parseISO(value) : value;
    if (!isValid(date)) return "—";
    return format(date, pattern);
}

export function formatDateTime(value) {
    return formatDate(value, "MMM d, yyyy h:mm a");
}

export function formatRelative(value) {
    if (!value) return "—";
    const date = typeof value === "string" ? parseISO(value) : value;
    if (!isValid(date)) return "—";
    return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(value, currency = "USD") {
    const number = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(number);
}

export function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function titleCase(value) {
    if (!value) return "";
    return value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}