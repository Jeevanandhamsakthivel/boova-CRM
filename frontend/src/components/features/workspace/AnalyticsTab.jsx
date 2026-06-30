import { useEffect, useRef, useState } from "react";
import { dealsApi } from "../../../api/pipelineApi";
import { tasksApi } from "../../../api/tasksApi";
import { followupsApi } from "../../../api/followupsApi";
import { customersApi } from "../../../api/customersApi";
import { formatCurrency, formatRelative } from "../../../utils/formatters";
import { Spinner } from "../../ui/Misc";
import { DonutChart, BarChart, ProgressRing, ChartLegend } from "../../ui/Charts";

const C = {
    open: "#3E6FA8",
    won:  "#3F8F6F",
    lost: "#C1543C",
    completed: "#3F8F6F",
    pending:   "#C99A2E",
};

function MetricCard({ label, value, sub, accent }) {
    return (
        <div className="ws-metric-card">
            <span className="ws-metric-value" style={accent ? { color: accent } : undefined}>{value}</span>
            <span className="ws-metric-label">{label}</span>
            {sub && <span className="ws-metric-sub">{sub}</span>}
        </div>
    );
}

export function AnalyticsTab({ customerId, activeTab }) {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (activeTab !== "analytics") return;
        if (loadedRef.current) return;

        setLoading(true);
        Promise.all([
            dealsApi.list({ customer_id: customerId, per_page: 200 }),
            tasksApi.list({ related_to_id: customerId, per_page: 200 }),
            followupsApi.list({ related_to_id: customerId, per_page: 200 }),
            customersApi.activities(customerId, { per_page: 1 }),
        ]).then(([dealsRes, tasksRes, fuRes, actRes]) => {
            const deals    = dealsRes.data.data || [];
            const tasks    = tasksRes.data.data || [];
            const followups = fuRes.data.data   || [];
            const lastAct  = (actRes.data.data  || [])[0] || null;

            const won  = deals.filter((d) => d.status === "won");
            const lost = deals.filter((d) => d.status === "lost");
            const open = deals.filter((d) => d.status === "open");

            const wonValue  = won.reduce((s, d)  => s + (d.value || 0), 0);
            const lostValue = lost.reduce((s, d) => s + (d.value || 0), 0);
            const openValue = open.reduce((s, d) => s + (d.value || 0), 0);

            const completedTasks    = tasks.filter((t) => t.status === "completed").length;
            const inProgressTasks   = tasks.filter((t) => t.status === "in_progress").length;
            const openTasks         = tasks.filter((t) => t.status === "todo").length;
            const completedFollowups = followups.filter((f) => f.status === "completed").length;
            const pendingFollowups   = followups.filter((f) => f.status === "pending").length;

            setMetrics({
                deals,
                wonCount: won.length, lostCount: lost.length, openCount: open.length,
                wonValue, lostValue, openValue,
                lifetimeValue: deals.reduce((s, d) => s + (d.value || 0), 0),
                avgWon: won.length ? wonValue / won.length : 0,
                totalTasks: tasks.length,       completedTasks, inProgressTasks, openTasks,
                totalFollowups: followups.length, completedFollowups, pendingFollowups,
                lastAct,
            });
            loadedRef.current = true;
        }).catch((e) => setError(e?.message || "Failed to load analytics."))
          .finally(() => setLoading(false));
    }, [activeTab, customerId]);

    if (activeTab !== "analytics") return null;
    if (loading) return <div className="ws-tab-loading"><Spinner /></div>;
    if (error)   return <div className="ws-tab-error"><p>{error}</p></div>;
    if (!metrics) return null;

    const noDeals = metrics.wonCount + metrics.lostCount + metrics.openCount === 0;
    const taskPct     = metrics.totalTasks     ? (metrics.completedTasks     / metrics.totalTasks)     * 100 : 0;
    const followupPct = metrics.totalFollowups ? (metrics.completedFollowups / metrics.totalFollowups) * 100 : 0;

    const donutSegs = [
        { label: "Open", value: metrics.openCount, color: C.open },
        { label: "Won",  value: metrics.wonCount,  color: C.won  },
        { label: "Lost", value: metrics.lostCount, color: C.lost },
    ].filter((s) => s.value > 0);

    return (
        <div className="ws-tab-content ws-analytics">

            {/* ── KPI strip ── */}
            <div className="ws-kpi-strip">
                <MetricCard label="Lifetime Value"    value={formatCurrency(metrics.lifetimeValue)} accent="var(--success)" />
                <MetricCard label="Avg Won Deal"      value={formatCurrency(metrics.avgWon)} />
                <MetricCard label="Open Pipeline"     value={formatCurrency(metrics.openValue)} accent="var(--info)" />
                <MetricCard
                    label="Task Completion"
                    value={`${metrics.completedTasks} / ${metrics.totalTasks}`}
                    sub={metrics.totalTasks ? `${Math.round(taskPct)}% done` : null}
                />
                <MetricCard
                    label="Follow-up Rate"
                    value={`${metrics.completedFollowups} / ${metrics.totalFollowups}`}
                    sub={metrics.totalFollowups ? `${Math.round(followupPct)}% done` : null}
                />
            </div>

            {/* ── Deal breakdown ── */}
            {noDeals ? (
                <div className="ws-empty-prompt">
                    No deals yet — create the first one to start tracking revenue.
                </div>
            ) : (
                <>
                    <h4 className="chart-section-heading">Deal Breakdown</h4>
                    <div className="chart-row">
                        <div className="chart-block">
                            <p className="chart-title">Status Distribution</p>
                            <div className="chart-donut-row">
                                <DonutChart
                                    segments={donutSegs}
                                    size={152}
                                    strokeWidth={26}
                                    label={String(metrics.wonCount + metrics.lostCount + metrics.openCount)}
                                    sublabel="total deals"
                                />
                                <ChartLegend items={[
                                    { color: C.open, label: "Open",  value: metrics.openCount },
                                    { color: C.won,  label: "Won",   value: metrics.wonCount  },
                                    { color: C.lost, label: "Lost",  value: metrics.lostCount },
                                ]} />
                            </div>
                        </div>

                        <div className="chart-block">
                            <BarChart
                                title="Value by Status"
                                bars={[
                                    { label: "Open", value: metrics.openValue, color: C.open },
                                    { label: "Won",  value: metrics.wonValue,  color: C.won  },
                                    { label: "Lost", value: metrics.lostValue, color: C.lost },
                                ]}
                                height={148}
                                formatValue={(v) => formatCurrency(v)}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* ── Completion rings ── */}
            {(metrics.totalTasks > 0 || metrics.totalFollowups > 0) && (
                <>
                    <h4 className="chart-section-heading">Completion Rates</h4>
                    <div className="chart-row chart-row-rings">
                        {metrics.totalTasks > 0 && (
                            <div className="chart-ring-group">
                                <ProgressRing pct={taskPct} size={80} color={C.completed} />
                                <div className="chart-ring-info">
                                    <span className="chart-ring-info-label">Tasks</span>
                                    <span className="chart-ring-info-detail">
                                        {metrics.completedTasks} done · {metrics.inProgressTasks} in progress · {metrics.openTasks} open
                                    </span>
                                </div>
                            </div>
                        )}
                        {metrics.totalFollowups > 0 && (
                            <div className="chart-ring-group">
                                <ProgressRing pct={followupPct} size={80} color={C.won} />
                                <div className="chart-ring-info">
                                    <span className="chart-ring-info-label">Follow-ups</span>
                                    <span className="chart-ring-info-detail">
                                        {metrics.completedFollowups} done · {metrics.pendingFollowups} pending
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Last activity ── */}
            {metrics.lastAct && (
                <div className="ws-last-activity">
                    <strong style={{ flexShrink: 0 }}>Last Activity:</strong>
                    <span>{metrics.lastAct.description}</span>
                    <span className="ws-meta-text" style={{ marginLeft: "auto", flexShrink: 0 }}>
                        {formatRelative(metrics.lastAct.created_at)}
                    </span>
                </div>
            )}
        </div>
    );
}
