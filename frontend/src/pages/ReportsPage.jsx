import { useEffect, useState } from "react";
import { reportsApi } from "../api/miscApi";

function BarChart({ data, labelKey, valueKey, color = "var(--accent)" }) {
    if (!data?.length) return <div className="empty-state" style={{ padding: "24px" }}><p>No data</p></div>;
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ minWidth: 120, fontSize: 12.5, color: "var(--ink-600)", textAlign: "right" }}>{d[labelKey]}</span>
                    <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: 4, height: 20, position: "relative" }}>
                        <div style={{ width: `${((d[valueKey] || 0) / max) * 100}%`, background: color, height: "100%", borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ minWidth: 36, fontSize: 12.5, fontWeight: 700, color: "var(--ink-700)" }}>{d[valueKey]}</span>
                </div>
            ))}
        </div>
    );
}

export default function ReportsPage() {
    const [byStatus, setByStatus] = useState([]);
    const [bySource, setBySource] = useState([]);
    const [byStage, setByStage] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            reportsApi.leadsByStatus(),
            reportsApi.leadsBySource(),
            reportsApi.dealsByStage(),
        ]).then(([s, src, stg]) => {
            setByStatus(s.data.data || []);
            setBySource(src.data.data || []);
            setByStage(stg.data.data || []);
        }).catch(() => {})
          .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Reports</h1>
                    <span className="page-header-subtitle">Key performance metrics</span>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="card card-pad">
                    <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "var(--ink-700)" }}>Leads by Status</h3>
                    <BarChart data={byStatus} labelKey="status" valueKey="count" color="var(--accent)" />
                </div>
                <div className="card card-pad">
                    <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "var(--ink-700)" }}>Leads by Source</h3>
                    <BarChart data={bySource} labelKey="source" valueKey="count" color="var(--info)" />
                </div>
                <div className="card card-pad" style={{ gridColumn: "1 / -1" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "var(--ink-700)" }}>Deals by Pipeline Stage</h3>
                    <BarChart data={byStage} labelKey="stage" valueKey="count" color="var(--success)" />
                </div>
            </div>
        </div>
    );
}
