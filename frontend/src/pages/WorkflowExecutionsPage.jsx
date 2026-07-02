import { useState, useEffect } from "react";
import { workflowExecutionsApi } from "../api/workflowsApi";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Pagination, Spinner } from "../components/ui/Misc";
import { WorkflowExecutionLog } from "../components/workflow/WorkflowExecutionLog";
import { useToast } from "../context/ToastContext";
import { formatDateTime, titleCase } from "../utils/formatters";
import {
    IconPlay, IconCheck, IconX, IconActivity, IconRefresh,
} from "../components/ui/Icons";

export default function WorkflowExecutionsPage() {
    const toast = useToast();
    const [executions, setExecutions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterStatus, setFilterStatus] = useState("");

    useEffect(() => {
        setLoading(true);
        const params = { page, per_page: 20 };
        if (filterStatus) params.status = filterStatus;
        Promise.all([
            workflowExecutionsApi.list(params),
            workflowExecutionsApi.getStats({ timeframe: 30 }),
        ])
            .then(([listRes, statsRes]) => {
                setExecutions(listRes.data.data || []);
                setTotal(listRes.data.meta?.total_count || 0);
                setStats(statsRes.data.data || {});
            })
            .catch(() => toast.error("Failed to load executions"))
            .finally(() => setLoading(false));
    }, [page, filterStatus, toast]);

    const statusFilters = ["", "pending", "running", "completed", "failed", "cancelled"];

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Workflow Executions</h1>
                    <span className="page-header-subtitle">{total} executions</span>
                </div>
                <div className="page-actions">
                    <Button variant="secondary" onClick={() => setPage(1)}>
                        <IconRefresh width={14} height={14} /> Refresh
                    </Button>
                </div>
            </div>

            {stats && (
                <div className="page-stats">
                    <div className="page-stat-card">
                        <div className="page-stat-icon" style={{ background: "#6366F114", color: "#6366F1" }}>
                            <IconActivity width={17} height={17} />
                        </div>
                        <div className="page-stat-body">
                            <span className="page-stat-value">{stats.total || 0}</span>
                            <span className="page-stat-label">Total (30d)</span>
                        </div>
                    </div>
                    <div className="page-stat-card">
                        <div className="page-stat-icon" style={{ background: "#10B98114", color: "#10B981" }}>
                            <IconCheck width={17} height={17} />
                        </div>
                        <div className="page-stat-body">
                            <span className="page-stat-value">{stats.completed || 0}</span>
                            <span className="page-stat-label">Completed</span>
                        </div>
                    </div>
                    <div className="page-stat-card">
                        <div className="page-stat-icon" style={{ background: "#EF444414", color: "#EF4444" }}>
                            <IconX width={17} height={17} />
                        </div>
                        <div className="page-stat-body">
                            <span className="page-stat-value">{stats.failed || 0}</span>
                            <span className="page-stat-label">Failed</span>
                        </div>
                    </div>
                    <div className="page-stat-card">
                        <div className="page-stat-icon" style={{ background: "#F59E0B14", color: "#F59E0B" }}>
                            <IconPlay width={17} height={17} />
                        </div>
                        <div className="page-stat-body">
                            <span className="page-stat-value">{stats.running || 0}</span>
                            <span className="page-stat-label">Running</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="filter-bar" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {statusFilters.map(s => (
                        <button
                            key={s}
                            className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => { setFilterStatus(s); setPage(1); }}
                        >
                            {s ? titleCase(s) : "All"}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20 }}>
                <div>
                    {loading ? (
                        <div className="page-loading"><Spinner size={28} /></div>
                    ) : executions.length === 0 ? (
                        <div className="empty-state">
                            <IconPlay width={40} height={40} />
                            <h3>No executions found</h3>
                            <p>Workflow executions will appear here when workflows are triggered.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {executions.map(exec => (
                                <div
                                    key={exec.id}
                                    className={`automation-card ${selected?.id === exec.id ? "automation-card-selected" : ""}`}
                                    onClick={() => setSelected(exec)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", margin: 0 }}>
                                                {exec.workflow_name || "Workflow"}
                                            </h3>
                                            <span style={{ fontSize: 12, color: "var(--ink-400)" }}>
                                                {exec.entity_type} · {exec.trigger_type}
                                            </span>
                                        </div>
                                        <StatusBadge status={exec.status} />
                                    </div>
                                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--ink-400)" }}>
                                        <span>Created {formatDateTime(exec.created_at)}</span>
                                        {exec.completed_at && <span>Completed {formatDateTime(exec.completed_at)}</span>}
                                        <span>{(exec.node_logs || []).length} node(s)</span>
                                    </div>
                                    {exec.error && (
                                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--accent-red)" }}>
                                            Error: {exec.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Pagination
                                meta={{ page, per_page: 20, total_count: total, total_pages: Math.ceil(total / 20), has_next: page < Math.ceil(total / 20), has_prev: page > 1 }}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>

                {selected && (
                    <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)", margin: 0 }}>Execution Details</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)}>×</button>
                        </div>
                        <WorkflowExecutionLog execution={selected} />
                    </div>
                )}
            </div>
        </div>
    );
}
