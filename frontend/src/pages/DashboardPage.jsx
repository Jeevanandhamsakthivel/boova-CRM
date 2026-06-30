import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi, activitiesApi } from "../api/miscApi";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatRelative } from "../utils/formatters";
import {
    IconLeads, IconCustomers, IconPipeline, IconTasks,
    IconActivity, IconArrowRight, IconRefresh,
} from "../components/ui/Icons";
import { BarChart, ProgressRing } from "../components/ui/Charts";
import BusinessHealthScore from "../components/business/BusinessHealthScore";
import AIBusinessAdvisor from "../components/business/AIBusinessAdvisor";
import TodayActionCenter from "../components/business/TodayActionCenter";
import RevenueForecast from "../components/business/RevenueForecast";
import SmartNotifications from "../components/business/SmartNotifications";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function KpiCard({ label, value, sub, icon: Icon, iconClass = "kpi-icon-purple", to }) {
    const navigate = useNavigate();
    return (
        <div className="kpi-card" onClick={() => to && navigate(to)} style={{ cursor: to ? "pointer" : "default" }}>
            <div className={`kpi-icon ${iconClass}`}>
                {Icon && <Icon width={18} height={18} />}
            </div>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value ?? "—"}</span>
            {sub && <span className="stat-sub">{sub}</span>}
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    function loadData() {
        setRefreshing(true);
        dashboardApi.summary()
            .then(r => setSummary(r.data.data))
            .catch(() => setSummary(null))
            .finally(() => { setLoading(false); setRefreshing(false); });

        activitiesApi.listRecent({ per_page: 8 })
            .then(r => setRecentActivities(r.data.data || []))
            .catch(() => {});
    }

    useEffect(loadData, []);

    const s = summary || {};
    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    }, []);

    const wonDeals = s.won_deals_count || 0;
    const totalDeals = (s.open_deals_count || 0) + wonDeals;
    const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

    if (loading) return (
        <div className="page-loading">
            <div className="spinner spinner-lg" />
        </div>
    );

    const hasStageData = s.stage_distribution && s.stage_distribution.length > 0;

    function PipelineWidget() {
        if (!hasStageData) return null;
        return (
            <div className="dash-panel">
                <div className="dash-panel-header">
                    <span className="dash-panel-title">Pipeline by Stage</span>
                    <Link to="/pipeline" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        View <IconArrowRight width={12} height={12} />
                    </Link>
                </div>
                <div className="dash-panel-body">
                    <BarChart
                        bars={s.stage_distribution.map((st, i) => ({
                            label: st.name || st._id,
                            value: st.count,
                            color: ["var(--accent)", "var(--accent-amber)", "var(--accent-green)", "var(--accent-blue)", "var(--accent-purple)", "var(--accent-cyan)"][i % 6],
                        }))}
                        height={160}
                        formatValue={(v) => v}
                    />
                </div>
            </div>
        );
    }

    function WinRateWidget() {
        return (
            <div className="dash-panel">
                <div className="dash-panel-header">
                    <span className="dash-panel-title">Win Rate</span>
                </div>
                <div className="dash-panel-body" style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <ProgressRing
                        pct={winRate}
                        size={100}
                        strokeWidth={10}
                        color="var(--accent-green)"
                        label={`${winRate}%`}
                        sublabel="win rate"
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span className="temp-dot" style={{ background: "var(--accent-green)" }} />
                            <span style={{ color: "var(--ink-600)" }}>Won</span>
                            <span style={{ fontWeight: 700, color: "var(--ink-900)", marginLeft: "auto" }}>{wonDeals}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span className="temp-dot" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border)" }} />
                            <span style={{ color: "var(--ink-600)" }}>Open</span>
                            <span style={{ fontWeight: 700, color: "var(--ink-900)", marginLeft: "auto" }}>{s.open_deals_count || 0}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span className="temp-dot" style={{ background: "var(--accent-red)" }} />
                            <span style={{ color: "var(--ink-600)" }}>Lost</span>
                            <span style={{ fontWeight: 700, color: "var(--ink-900)", marginLeft: "auto" }}>{s.lost_deals_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function ActivityWidget() {
        return (
            <div className="dash-panel">
                <div className="dash-panel-header">
                    <span className="dash-panel-title">Recent Activity</span>
                    <Link to="/reports" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        View all <IconArrowRight width={12} height={12} />
                    </Link>
                </div>
                <div className="dash-panel-body" style={{ padding: "4px 20px" }}>
                    {recentActivities.length === 0 ? (
                        <div className="empty-state" style={{ padding: "30px 20px" }}>
                            <IconActivity width={24} height={24} style={{ color: "var(--ink-400)" }} />
                            <h3>No recent activity</h3>
                            <p>Start by adding a lead or customer.</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {recentActivities.map((a, i) => (
                                <div key={a.id || i} className="dash-activity-item">
                                    <div className="dash-activity-dot" style={{ background: "var(--accent)" }} />
                                    <div className="dash-activity-text">
                                        {a.description || a.title || "Activity"}
                                        <div className="dash-activity-time">{formatRelative(a.created_at)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const widgets = [
        {
            id: "health", title: "Business Health", span: 1,
            render: () => <BusinessHealthScore metrics={s} />,
        },
        {
            id: "actions", title: "Action Center", span: 1,
            render: () => <TodayActionCenter summary={s} />,
        },
        {
            id: "advisor", title: "AI Advisor", span: 1,
            render: () => <AIBusinessAdvisor summary={s} />,
        },
        {
            id: "forecast", title: "Revenue Forecast", span: 2,
            render: () => <RevenueForecast summary={s} />,
        },
        {
            id: "notifications", title: "Notifications", span: 1,
            render: () => <SmartNotifications compact />,
        },
        {
            id: "pipeline", title: "Pipeline by Stage", span: 2,
            render: () => <PipelineWidget />,
        },
        {
            id: "winrate", title: "Win Rate", span: 1,
            render: () => <WinRateWidget />,
        },
        {
            id: "activity", title: "Recent Activity", span: 2,
            render: () => <ActivityWidget />,
        },
    ];

    const defaultOrder = ["health", "actions", "forecast", "advisor", "pipeline", "winrate", "notifications", "activity"];

    return (
        <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">{greeting}, {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there"}!</h1>
                    <p className="page-subtitle">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        {' — '}Here's your Business OS overview.
                    </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={refreshing}>
                    <IconRefresh width={14} height={14} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {/* Top Row: KPI Cards (always visible, not draggable) */}
            <div className="dash-kpi-grid">
                <KpiCard label="Total Leads" value={s.total_leads ?? 0} sub={`${s.new_leads ?? 0} new this period`} icon={IconLeads} iconClass="kpi-icon-purple" to="/leads" />
                <KpiCard label="Customers" value={s.total_customers ?? 0} sub="Active accounts" icon={IconCustomers} iconClass="kpi-icon-green" to="/customers" />
                <KpiCard label="Open Deals" value={s.open_deals_count ?? 0} sub={formatCurrency(s.open_deals_value) + " value"} icon={IconPipeline} iconClass="kpi-icon-amber" to="/pipeline" />
                <KpiCard label="Pending Tasks" value={s.pending_tasks ?? 0} sub={`${s.overdue_tasks ?? 0} overdue`} icon={IconTasks} iconClass="kpi-icon-red" to="/tasks" />
            </div>

            {/* Draggable Widget Layout */}
            <DashboardLayout widgets={widgets} defaultOrder={defaultOrder}>
                {/* Pipeline Value CTA — rendered below widgets */}
                {s.open_deals_value > 0 && (
                    <div className="dash-ai-card" style={{ background: "var(--gradient-dark)", gridColumn: "1 / -1", marginTop: 20 }}>
                        <span className="dash-ai-title">Total Open Pipeline Value</span>
                        <span className="dash-ai-text" style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(s.open_deals_value)}</span>
                        <Link to="/pipeline" className="dash-ai-btn" style={{ marginTop: 8, textDecoration: 'none' }}>
                            Open Pipeline <IconArrowRight width={14} height={14} />
                        </Link>
                    </div>
                )}
            </DashboardLayout>
        </>
    );
}