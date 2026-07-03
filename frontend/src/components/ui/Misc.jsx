import { IconChevronLeft, IconChevronRight } from "./Icons";
import { Button } from "./Button";

export function Pagination({ meta, onPageChange }) {
    if (!meta || meta.total_count === 0) return null;
    const start = (meta.page - 1) * meta.per_page + 1;
    const end = Math.min(meta.page * meta.per_page, meta.total_count);

    return (
        <div className="pagination-bar">
            <span>
                Showing {start}–{end} of {meta.total_count}
            </span>
            <div className="pagination-controls">
                <Button
                    variant="secondary"
                    size="sm"
                    icon
                    disabled={!meta.has_prev}
                    onClick={() => onPageChange(meta.page - 1)}
                    aria-label="Previous page"
                >
                    <IconChevronLeft width={15} height={15} />
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    icon
                    disabled={!meta.has_next}
                    onClick={() => onPageChange(meta.page + 1)}
                    aria-label="Next page"
                >
                    <IconChevronRight width={15} height={15} />
                </Button>
            </div>
        </div>
    );
}

export function Spinner({ size = 18 }) {
    return <span className="spinner" style={{ width: size, height: size }} />;
}

export function PageLoading() {
    return (
        <div className="page-loading">
            <Spinner size={26} />
        </div>
    );
}

export function EmptyState({ icon, title, message, action }) {
    return (
        <div className="empty-state">
            {icon}
            <h3>{title}</h3>
            {message && <p>{message}</p>}
            {action}
        </div>
    );
}

export function InlineError({ message, onRetry }) {
    return (
        <div className="error-banner">
            <span style={{ flex: 1 }}>{message || "Something went wrong."}</span>
            {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
            )}
        </div>
    );
}

export function InlineLoading({ message }) {
    return (
        <div className="page-loading" style={{ padding: 40 }}>
            <Spinner size={22} />
            {message && <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-500)" }}>{message}</p>}
        </div>
    );
}