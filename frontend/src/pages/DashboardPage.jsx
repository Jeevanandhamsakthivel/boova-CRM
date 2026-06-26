import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/miscApi";

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="stat-card">
            <span className="stat-label">{label}</span>
            <span className="stat-value" style={accent ? { color: accent } : {}}>{value ?? "—"}</span>
            {sub && <span className="stat-sub">{sub}</span>}
        </div>
    );
}

export default function DashboardPage() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardApi.summary()
            .then(r => setSummary(r.data.data))
            .catch(() => setSummary(null))
            .finally(() => setLoading(false));
    }, []);

    const s = summary || {};

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Dashboard</h1>
                    <span className="page-header-subtitle">Overview of your CRM activity</span>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
                        <StatCard label="Total Leads" value={s.total_leads} sub="All time" />
                        <StatCard label="Open Leads" value={s.open_leads} accent="var(--accent)" />
                        <StatCard label="Customers" value={s.total_customers} />
                        <StatCard label="Open Tasks" value={s.open_tasks} accent="var(--warning)" />
                        <StatCard label="Follow-ups Due" value={s.followups_due} accent="var(--danger)" />
                        <StatCard label="Pipeline Value" value={s.pipeline_value != null ? `₹${Number(s.pipeline_value).toLocaleString()}` : "—"} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="card card-pad">
                            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ink-700)" }}>Quick Links</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {[
                                    { to: "/leads", label: "→ Manage Leads" },
                                    { to: "/customers", label: "→ View Customers" },
                                    { to: "/pipeline", label: "→ Pipeline Board" },
                                    { to: "/tasks", label: "→ My Tasks" },
                                    { to: "/followups", label: "→ Follow-ups" },
                                ].map(l => (
                                    <Link key={l.to} to={l.to} style={{ color: "var(--accent-strong)", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>{l.label}</Link>
                                ))}
                            </div>
                        </div>

                        {s.recent_leads?.length > 0 && (
                            <div className="card card-pad">
                                <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ink-700)" }}>Recent Leads</h3>
                                {s.recent_leads.map(lead => (
                                    <Link key={lead.id} to={`/leads/${lead.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-hairline)", textDecoration: "none", color: "var(--ink-800)", fontSize: 13 }}>
                                        <span>{lead.name}</span>
                                        <span className="text-muted text-sm">{lead.status}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
