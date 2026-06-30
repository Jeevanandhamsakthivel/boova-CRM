import { useMemo, useState } from "react";
import { IconChevronDown, IconChevronUp, IconSearch } from "./Icons";

export function DataTable({
    columns,
    data,
    keyField = "id",
    onRowClick,
    selectedRows,
    onSelectedRowsChange,
    sortable = true,
    searchable = false,
    loading = false,
    emptyMessage = "No records found",
    page,
    totalPages,
    totalCount,
    onPageChange,
    pageSize = 20,
}) {
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const [searchQuery, setSearchQuery] = useState("");

    const handleSort = (key) => {
        if (!sortable) return;
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return (data || []).filter((row) =>
            columns.some((col) => {
                const val = col.accessor ? row[col.accessor] : null;
                return val != null && String(val).toLowerCase().includes(q);
            })
        );
    }, [data, searchQuery, columns]);

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    const allSelected = selectedRows?.length === sorted.length && sorted.length > 0;
    const someSelected = selectedRows?.length > 0 && !allSelected;

    const toggleAll = () => {
        if (!onSelectedRowsChange) return;
        if (allSelected) {
            onSelectedRowsChange([]);
        } else {
            onSelectedRowsChange(sorted.map((r) => r[keyField]));
        }
    };

    const toggleRow = (id) => {
        if (!onSelectedRowsChange) return;
        if (selectedRows?.includes(id)) {
            onSelectedRowsChange(selectedRows.filter((sid) => sid !== id));
        } else {
            onSelectedRowsChange([...(selectedRows || []), id]);
        }
    };

    if (loading) {
        return (
            <div className="data-table-wrap">
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto" }} />
                </div>
            </div>
        );
    }

    return (
        <div className="data-table-wrap">
            {searchable && (
                <div style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--surface-sunken)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <IconSearch width={16} height={16} style={{ color: "var(--ink-400)", flexShrink: 0 }} />
                    <input
                        className="field-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in table..."
                        style={{ height: 32, fontSize: 13, padding: "4px 10px", flex: 1, maxWidth: 280 }}
                    />
                    {searchQuery && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSearchQuery("")}
                            style={{ flexShrink: 0 }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}
            <table className="data-table">
                <thead>
                    <tr>
                        {onSelectedRowsChange && (
                            <th style={{ width: 40 }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = someSelected;
                                    }}
                                    onChange={toggleAll}
                                    style={{ cursor: "pointer", accentColor: "var(--accent)" }}
                                />
                            </th>
                        )}
                        {columns.map((col) => (
                            <th
                                key={col.accessor || col.header}
                                className={sortable && col.accessor ? "sortable" : ""}
                                onClick={() => col.accessor && handleSort(col.accessor)}
                                style={{
                                    width: col.width,
                                    minWidth: col.minWidth,
                                    textAlign: col.align || "left",
                                    cursor: col.accessor && sortable ? "pointer" : "default",
                                }}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    {col.header}
                                    {sortable && col.accessor && sortKey === col.accessor && (
                                        sortDir === "asc" ? <IconChevronUp width={12} height={12} /> : <IconChevronDown width={12} height={12} />
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (onSelectedRowsChange ? 1 : 0)}
                                style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-400)" }}
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sorted.map((row, i) => {
                            const id = row[keyField] || i;
                            const isSelected = selectedRows?.includes(id);
                            return (
                                <tr
                                    key={id}
                                    className={isSelected ? "selected" : ""}
                                    onClick={() => onRowClick?.(row)}
                                    style={{ cursor: onRowClick ? "pointer" : "default" }}
                                >
                                    {onSelectedRowsChange && (
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleRow(id)}
                                                style={{ cursor: "pointer", accentColor: "var(--accent)" }}
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => {
                                        const val = col.accessor ? row[col.accessor] : null;
                                        return (
                                            <td
                                                key={col.accessor || col.header}
                                                style={{
                                                    textAlign: col.align || "left",
                                                    ...(col.cellStyle || {}),
                                                }}
                                            >
                                                {col.render ? col.render(val, row) : (val ?? "—")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            {totalPages > 1 && onPageChange && (
                <div className="pagination-bar">
                    <span>
                        Showing page {page} of {totalPages} ({totalCount} records)
                    </span>
                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            disabled={page <= 1}
                            onClick={() => onPageChange(page - 1)}
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                            .map((p, idx, arr) => (
                                <span key={p} style={{ display: "inline-flex", gap: 2 }}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span style={{ padding: "0 4px", color: "var(--ink-300)" }}>…</span>
                                    )}
                                    <button
                                        className={`pagination-btn${p === page ? " active" : ""}`}
                                        onClick={() => onPageChange(p)}
                                    >
                                        {p}
                                    </button>
                                </span>
                            ))}
                        <button
                            className="pagination-btn"
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function FilterBar({ filters, onFilterChange, children }) {
    return (
        <div className="toolbar">
            <div className="toolbar-filters">
                {filters?.map((filter) => (
                    <div key={filter.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {filter.label && (
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-400)" }}>
                                {filter.label}
                            </label>
                        )}
                        {filter.type === "select" && (
                            <select
                                className="field-select"
                                value={filter.value || ""}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                                style={{ height: 32, fontSize: 12.5, padding: "4px 10px", maxWidth: 160 }}
                            >
                                <option value="">All</option>
                                {filter.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        )}
                        {filter.type === "search" && (
                            <div className="search-input-wrap" style={{ width: 200 }}>
                                <input
                                    className="field-input"
                                    value={filter.value || ""}
                                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                                    placeholder={filter.placeholder || "Search..."}
                                    style={{ height: 32, fontSize: 12.5, padding: "4px 10px 4px 32px" }}
                                />
                                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={14} height={14}>
                                    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {children && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{children}</div>}
        </div>
    );
}
