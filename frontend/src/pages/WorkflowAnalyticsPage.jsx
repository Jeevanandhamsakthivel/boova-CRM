import { useState, useEffect } from "react";
import { workflowAnalyticsApi, workflowsApi } from "../api/workflowsApi";
import { Spinner } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { titleCase } from "../utils/formatters";
import {
    IconBarChart, IconActivity, IconCheck, IconX, IconTrendUp,
} from "../components/ui/Icons";

export default function WorkflowAnalyticsPage() {
    const toast = useToast();
    const [overview, setOverview] = useState(null);
    const [workflows, setWorkflows] = useState([]);
    const [selectedWf, setSelectedWf] = useState(null);
    const [perf, setPerf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState(30);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            workflowAnalyticsApi.getOverview({ timeframe }),
            workflowsApi.list({ per_page: 100 }),
        ])
            .then(([analyticsRes, wfRes]) => {
                setOverview(analyticsRes.data.data || {});
                setWorkflows(wfRes.data.data || []);
            })
            .catch(() => toast.error("Failed to load analytics"))
            .finally(() => setLoading(false));
    }, [timeframe, toast]);

    useEffect(() => {
        if (selectedWf) {
            workflowAnalyticsApi.getWorkflowPerformance(selectedWf, { timeframe })
                .then(res => setPerf(res.data.data || {}))
                .catch(() => setPerf(null));
        } else {
            setPerf(null);
        }
    }, [selectedWf, timeframe]);

    if (loading) {
        return <div className="page-loading"><Spinner size={32} /></div>;
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Workflow Analytics</h1>
                </div>
                <div className="page-actions">
                    <select className="field-select" value={timeframe} onChange={e => setTimeframe(Number(e.target.value))} style={{ width: 140 }}>
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last year</option>
                    </select>
                </div>
            </div>

            {overview && (
                <>
                    <div className="page-stats">
                        <div className="page-stat-card">
                            <div className="page-stat-icon" style={{ background: "#6366F114", color: "#6366F1" }}>
                                <IconBarChart width={17} height={17} />
                            </div>
                            <div className="page-stat-body">
                                <span className="page-stat-value">{overview.total_workflows || 0}</span>
                                <span className="page-stat-label">Total Workflows</span>
                            </div>
                        </div>
                        <div className="page-stat-card">
                            <div className="page-stat-icon" style={{ background: "#10B98114", color: "#10B981" }}>
                                <IconCheck width={17} height={17} />
                            </div>
                            <div className="page-stat-body">
                                <span className="page-stat-value">{overview.completed_executions || 0}</span>
                                <span className="page-stat-label">Completed</span>
                            </div>
                        </div>
                        <div className="page-stat-card">
                            <div className="page-stat-icon" style={{ background: "#EF444414", color: "#EF4444" }}>
                                <IconX width={17} height={17} />
                            </div>
                            <div className="page-stat-body">
                                <span className="page-stat-value">{overview.failed_executions || 0}</span>
                                <span className="page-stat-label">Failed</span>
                            </div>
                        </div>
                        <div className="page-stat-card">
                            <div className="page-stat-icon" style={{ background: "#10B98114", color: "#10B981" }}>
                                <IconTrendUp width={17} height={17} />
                            </div>
                            <div className="page-stat-body">
                                <span className="page-stat-value">{(overview.success_rate || 0).toFixed(1)}%</span>
                                <span className="page-stat-label">Success Rate</span>
                            </div>
                        </div>
                    </div>

                    <div className="dash-kpi-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
                        <div className="kpi-card" style={{ padding: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--ink-900)" }}>By Category</h3>
                            {overview.by_category && Object.keys(overview.by_category).length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {Object.entries(overview.by_category).map(([cat, count]) => (
                                        <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                            <span style={{ color: "var(--ink-600)" }}>{titleCase(cat)}</span>
                                            <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: "var(--ink-400)", fontSize: 13 }}>No data yet</p>
                            )}
                        </div>

                        <div className="kpi-card" style={{ padding: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--ink-900)" }}>By Entity Type</h3>
                            {overview.by_entity && Object.keys(overview.by_entity).length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {Object.entries(overview.by_entity).map(([entity, count]) => (
                                        <div key={entity} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                            <span style={{ color: "var(--ink-600)" }}>{titleCase(entity)}</span>
                                            <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: "var(--ink-400)", fontSize: 13 }}>No data yet</p>
                            )}
                        </div>
                    </div>

                    <div className="kpi-card" style={{ padding: 20, marginTop: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--ink-900)" }}>Workflow Performance</h3>
                        <div style={{ marginBottom: 12 }}>
                            <select className="field-select" value={selectedWf || ""} onChange={e => setSelectedWf(e.target.value || null)} style={{ width: 300 }}>
                                <option value="">Select a workflow...</option>
                                {workflows.map(wf => (
                                    <option key={wf.id} value={wf.id}>{wf.name}</option>
                                ))}
                            </select>
                        </div>
                        {perf ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                                <div>
                                    <span style={{ fontSize: 12, color: "var(--ink-400)", display: "block" }}>Total Executions</span>
                                    <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-900)" }}>{perf.total || 0}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: 12, color: "var(--ink-400)", display: "block" }}>Completed</span>
                                    <span style={{ fontSize: 20, fontWeight: 700, color: "#10B981" }}>{perf.completed || 0}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: 12, color: "var(--ink-400)", display: "block" }}>Failed</span>
                                    <span style={{ fontSize: 20, fontWeight: 700, color: "#EF4444" }}>{perf.failed || 0}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: 12, color: "var(--ink-400)", display: "block" }}>Success Rate</span>
                                    <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-900)" }}>{(perf.success_rate || 0).toFixed(1)}%</span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: "var(--ink-400)", fontSize: 13 }}>{selectedWf ? "Loading..." : "Select a workflow to view performance"}</p>
                        )}
                    </div>

                    {overview.node_type_usage && Object.keys(overview.node_type_usage).length > 0 && (
                        <div className="kpi-card" style={{ padding: 20, marginTop: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--ink-900)" }}>Node Type Usage</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {Object.entries(overview.node_type_usage)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([type, count]) => (
                                        <div key={type} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                            <span style={{ color: "var(--ink-600)" }}>{titleCase(type)}</span>
                                            <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {overview.executions_by_day && overview.executions_by_day.length > 0 && (
                        <div className="kpi-card" style={{ padding: 20, marginTop: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--ink-900)" }}>Executions Per Day</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {overview.executions_by_day.slice(-14).map(day => (
                                    <div key={day._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                                        <span style={{ width: 80, color: "var(--ink-500)" }}>{day._id}</span>
                                        <div style={{ flex: 1, height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${day.count > 0 ? Math.min(day.count / 10 * 100, 100) : 0}%`, background: "var(--accent)", borderRadius: 4 }} />
                                        </div>
                                        <span style={{ fontWeight: 600, color: "var(--ink-900)", width: 30, textAlign: "right" }}>{day.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
