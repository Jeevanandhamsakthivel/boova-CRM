import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { workflowsApi } from "../api/workflowsApi";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Pagination, Spinner } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate, titleCase } from "../utils/formatters";
import {
    IconWorkflow, IconPlay, IconBarChart, IconPlus, IconChevronRight,
} from "../components/ui/Icons";

export default function WorkflowDashboardPage() {
    const toast = useToast();
    const [workflows, setWorkflows] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const perPage = 16;

    useEffect(() => {
        setLoading(true);
        Promise.all([
            workflowsApi.list({ page, per_page: perPage }),
            workflowsApi.getStats(),
        ])
            .then(([listRes, statsRes]) => {
                setWorkflows(listRes.data.data || []);
                setTotal(listRes.data.meta?.total_count || 0);
                setStats(statsRes.data.data || {});
            })
            .catch(() => toast.error("Failed to load workflow data"))
            .finally(() => setLoading(false));
    }, [page, toast]);

    const statCards = useMemo(() => {
        if (!stats) return [];
        return [
            { label: "Total Workflows", value: stats.total, color: "#6366F1", icon: IconWorkflow },
            { label: "Active", value: stats.active, color: "#10B981", icon: IconPlay },
            { label: "Draft", value: stats.draft, color: "#F59E0B", icon: IconBarChart },
            { label: "Inactive", value: stats.inactive, color: "#EF4444", icon: IconWorkflow },
        ];
    }, [stats]);

    const totalPages = Math.ceil(total / perPage);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Workflow Dashboard</h1>
                    <span className="page-header-subtitle">{total} workflows</span>
                </div>
                <div className="page-actions">
                    <Link to="/workflows/builder">
                        <Button><IconPlus width={14} height={14} /> New Workflow</Button>
                    </Link>
                </div>
            </div>

            <div className="page-stats">
                {statCards.map(card => (
                    <div key={card.label} className="page-stat-card">
                        <div className="page-stat-icon" style={{ background: `${card.color}14`, color: card.color }}>
                            <card.icon width={17} height={17} />
                        </div>
                        <div className="page-stat-body">
                            <span className="page-stat-value">{card.value}</span>
                            <span className="page-stat-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dash-kpi-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
                {stats?.categories && (
                    <div className="kpi-card" style={{ padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--ink-900)" }}>By Category</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {Object.entries(stats.categories).map(([cat, count]) => (
                                <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                    <span style={{ color: "var(--ink-600)" }}>{titleCase(cat)}</span>
                                    <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="kpi-card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--ink-900)" }}>Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <Link to="/workflows/builder" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)", color: "var(--accent)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            Create New Workflow <IconChevronRight width={14} height={14} />
                        </Link>
                        <Link to="/workflows/templates" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)", color: "var(--accent)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            Browse Templates <IconChevronRight width={14} height={14} />
                        </Link>
                        <Link to="/workflows/executions" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)", color: "var(--accent)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            View Executions <IconChevronRight width={14} height={14} />
                        </Link>
                        <Link to="/workflows/analytics" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)", color: "var(--accent)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            View Analytics <IconChevronRight width={14} height={14} />
                        </Link>
                    </div>
                </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 24, marginBottom: 12, color: "var(--ink-900)" }}>Recent Workflows</h3>

            {loading ? (
                <div className="page-loading"><Spinner size={28} /></div>
            ) : workflows.length === 0 ? (
                <div className="empty-state">
                    <IconWorkflow width={40} height={40} />
                    <h3>No workflows yet</h3>
                    <p>Create your first workflow to automate business processes.</p>
                    <Link to="/workflows/builder"><Button style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> New Workflow</Button></Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {workflows.map(wf => (
                        <Link key={wf.id} to={`/workflows/builder?id=${wf.id}`} style={{ textDecoration: "none" }}>
                            <div className="automation-card" style={{ cursor: "pointer" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div>
                                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)", margin: 0 }}>{wf.name}</h3>
                                            <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{wf.category ? titleCase(wf.category) : "—"} · {wf.entity_type}</span>
                                        </div>
                                    </div>
                                    <StatusBadge status={wf.status} />
                                </div>
                                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                                    {wf.description || "No description"}
                                </div>
                                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--ink-400)" }}>
                                    <span>{(wf.nodes || []).length} nodes</span>
                                    <span>Updated {formatDate(wf.updated_at)}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    <Pagination meta={{ page, per_page: perPage, total_count: total, total_pages: totalPages, has_next: page < totalPages, has_prev: page > 1 }} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
}
