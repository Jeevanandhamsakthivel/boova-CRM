import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi, activitiesApi } from "../api/miscApi";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatRelative } from "../utils/formatters";
import {
    IconLeads, IconCustomers, IconPipeline, IconTasks,
    IconFollowups, IconTrendUp, IconTarget, IconActivity,
    IconDollar, IconCalendar, IconPlus, IconArrowRight,
    IconBell, IconRefresh,
} from "../components/ui/Icons";
import { DonutChart, BarChart, ProgressRing, ChartLegend } from "../components/ui/Charts";

function KpiCard({ label, value, sub, accent, icon: Icon, trend, to }) {
    const navigate = useNavigate();
    return (
        <div
            className="dash-kpi-card"
            style={{ borderTop: `3px solid ${accent}` }}
            onClick={() => to && navigate(to)}
        >
            <div className="dash-kpi-icon" style={{ background: accent + "14", color: accent }}>
                {Icon && <Icon width={19} height={19} />}
            </div>
            <div className="dash-kpi-body">
                <span className="dash-kpi-value">{value ?? "—"}</span>
                <span className="dash-kpi-label">{label}</span>
                {sub && <span className="dash-kpi-sub">{sub}</span>}
                {trend !== undefined && (
                    <span className="dash-kpi-trend" style={{ color: trend >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    );
}

function PriorityItem({ icon: Icon, accent, label, count, to }) {
    return (
        <Link to={to} className="dash-priority-item">
            <div className="dash-priority-icon" style={{ background: accent + "14", color: accent }}>
                <Icon width={16} height={16} />
            </div>
            <div className="dash-priority-body">
                <div className="dash-priority-label">{label}</div>
            </div>
            <div className="dash-priority-count" style={{ color: accent }}>
                {count ?? 0}
            </div>
        </Link>
    );
}

function QuickAction({ icon: Icon, label, to, accent = "var(--accent)" }) {
    return (
        <Link to={to} className="dash-quick-action">
            <Icon width={15} height={15} />
            <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{label}</span>
            <IconArrowRight width={13} height={13} />
        </Link>
    );
}

function ActivityItem({ activity }) {
    return (
        <div className="dash-activity-item">
            <div className="dash-activity-dot" />
            <div className="dash-activity-content">
                <p className="dash-activity-text">{activity.description || activity.title || "Activity"}</p>
                <span className="dash-activity-time">{formatRelative(activity.created_at)}</span>
            </div>
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

    const conversionRate = s.total_leads > 0 ? Math.round(((s.total_customers || 0) / s.total_leads) * 100) : 0;

    if (loading) return (
        <div className="page-loading">
            <div className="spinner spinner-lg" />
        </div>
    );

    return (
        <div className="dash-page">
            {/* Greeting */}
            <div className="dash-greeting">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1>{greeting}, {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there"}</h1>
                        <p>Here's what's happening across your pipeline today.</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={refreshing}>
                        <IconRefresh width={14} height={14} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="dash-kpi-strip">
                <KpiCard label="Total Leads"     value={s.total_leads ?? 0}         sub={`${s.new_leads ?? 0} new this period`}      accent="#6366F1" icon={IconLeads}     to="/leads" />
                <KpiCard label="Customers"       value={s.total_customers ?? 0}     sub="Active accounts"                             accent="#10B981" icon={IconCustomers}  to="/customers" />
                <KpiCard label="Open Deals"      value={s.open_deals_count ?? 0}    sub={formatCurrency(s.open_deals_value) + " value"} accent="#F59E0B" icon={IconPipeline}  to="/pipeline" />
                <KpiCard label="Pending Tasks"   value={s.pending_tasks ?? 0}       sub={`${s.overdue_tasks ?? 0} overdue`}           accent="#EF4444" icon={IconTasks}     to="/tasks" />
                <KpiCard label="Win Rate"        value={winRate + "%"}              sub={`${wonDeals} won of ${totalDeals} deals`}    accent="#8B5CF6" icon={IconTarget}    to="/pipeline" />
                <KpiCard label="Conversion"      value={conversionRate + "%"}       sub="Leads to customers"                          accent="#14B8A6" icon={IconTrendUp}   to="/reports" />
            </div>

            {/* Main grid */}
            <div className="dash-grid">
                {/* Priority Queue */}
                <div className="dash-card">
                    <div className="dash-section-head">
                        <h3>Priority Queue</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <PriorityItem icon={IconTasks}     accent="#EF4444" label="Overdue tasks"            count={s.overdue_tasks}     to="/tasks" />
                        <PriorityItem icon={IconFollowups} accent="#8B5CF6" label="Pending follow-ups"       count={s.pending_followups} to="/followups" />
                        <PriorityItem icon={IconLeads}     accent="#6366F1" label="New leads to review"      count={s.new_leads}         to="/leads?status=new" />
                        <PriorityItem icon={IconPipeline}  accent="#F59E0B" label="Open deals in pipeline"   count={s.open_deals_count}  to="/pipeline" />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dash-card">
                    <div className="dash-section-head">
                        <h3>Quick Actions</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <QuickAction icon={IconPlus}      label="Add a new lead"          to="/leads" />
                        <QuickAction icon={IconCustomers} label="View all customers"       to="/customers" />
                        <QuickAction icon={IconPipeline}  label="Check pipeline"           to="/pipeline" />
                        <QuickAction icon={IconTasks}     label="Clear outstanding tasks"  to="/tasks" />
                        <QuickAction icon={IconFollowups} label="Review follow-ups"        to="/followups" />
                        <QuickAction icon={IconActivity}  label="View reports & analytics" to="/reports" />
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="dash-card dash-card-wide">
                    <div className="dash-section-head">
                        <h3>Recent Activity</h3>
                        <Link to="/reports" className="dash-section-link">
                            View all <IconArrowRight width={12} height={12} />
                        </Link>
                    </div>
                    {recentActivities.length === 0 ? (
                        <div className="dash-activity-empty">
                            No recent activity yet. Start by adding a lead or customer.
                        </div>
                    ) : (
                        recentActivities.map((a, i) => <ActivityItem key={a.id || i} activity={a} />)
                    )}
                </div>

                {/* Pipeline Value Banner */}
                <div className="dash-pipeline-banner">
                    <div className="dash-pipeline-banner-left">
                        <div className="dash-pipeline-banner-icon">
                            <IconDollar width={24} height={24} />
                        </div>
                        <div className="dash-pipeline-banner-info">
                            <h3>Total Open Pipeline</h3>
                            <div className="value">{formatCurrency(s.open_deals_value)}</div>
                        </div>
                    </div>
                    <Link to="/pipeline" className="dash-pipeline-banner-cta">
                        Open Pipeline <IconArrowRight width={14} height={14} />
                    </Link>
                </div>

                {/* Deal Stage Distribution Chart */}
                {s.stage_distribution && s.stage_distribution.length > 0 && (
                    <div className="dash-chart-card" style={{ gridColumn: "span 2" }}>
                        <div className="dash-section-head">
                            <h3>Pipeline by Stage</h3>
                            <Link to="/pipeline" className="dash-section-link">
                                View pipeline <IconArrowRight width={12} height={12} />
                            </Link>
                        </div>
                        <BarChart
                            bars={s.stage_distribution.map((st, i) => ({
                                label: st.name || st._id,
                                value: st.count,
                                color: ["#6366F1", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#14B8A6"][i % 6],
                            }))}
                            height={140}
                            formatValue={(v) => v}
                        />
                    </div>
                )}

                {/* Win Rate Ring */}
                <div className="dash-chart-card">
                    <div className="dash-section-head">
                        <h3>Win Rate</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <ProgressRing
                            pct={winRate}
                            size={100}
                            strokeWidth={10}
                            color="var(--accent-green)"
                            label={`${winRate}%`}
                            sublabel="win rate"
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)" }} />
                                <span style={{ color: "var(--ink-600)" }}>Won</span>
                                <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{wonDeals}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--surface-sunken)" }} />
                                <span style={{ color: "var(--ink-600)" }}>Open</span>
                                <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{s.open_deals_count || 0}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-red)" }} />
                                <span style={{ color: "var(--ink-600)" }}>Lost</span>
                                <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{s.lost_deals_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
