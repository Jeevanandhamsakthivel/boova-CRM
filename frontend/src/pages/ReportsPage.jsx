import { useEffect, useState } from "react";
import { reportsApi } from "../api/miscApi";
import { formatCurrency } from "../utils/formatters";
import { IconRefresh } from "../components/ui/Icons";

/* ── Colour palette ──────────────────────────────────────── */
const PALETTE = [
    "#6366F1", "#F59E0B", "#10B981", "#EF4444",
    "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
    "#F97316", "#84CC16",
];

const STATUS_COLORS = {
    new: "#6366F1", contacted: "#F59E0B", qualified: "#10B981",
    unqualified: "#94A3B8", converted: "#3B82F6", lost: "#EF4444",
};

const TASK_COLORS = {
    todo: "#94A3B8", in_progress: "#F59E0B", completed: "#10B981", cancelled: "#EF4444",
};

function titleCase(s) {
    return (s || "—").split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function sum(arr, key) { return arr.reduce((s, d) => s + (Number(d[key]) || 0), 0); }

/* ── Horizontal Bar Chart ────────────────────────────────── */
function HBarChart({ rows, labelKey, valueKey, colorFn, formatVal }) {
    if (!rows?.length) return <div className="rpt-empty">No data</div>;
    const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);
    return (
        <div className="rpt-hbar-list">
            {rows.map((row, i) => {
                const val = Number(row[valueKey]) || 0;
                const pct = (val / max) * 100;
                const color = colorFn ? colorFn(row[labelKey]) : PALETTE[i % PALETTE.length];
                return (
                    <div key={i} className="rpt-hbar-row">
                        <span className="rpt-hbar-label">{titleCase(row[labelKey])}</span>
                        <div className="rpt-hbar-track">
                            <div className="rpt-hbar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="rpt-hbar-val">{formatVal ? formatVal(val) : val}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Donut Chart ─────────────────────────────────────────── */
function DonutChart({ slices, size = 160, stroke = 28 }) {
    if (!slices?.length) return <div className="rpt-empty">No data</div>;
    const total = slices.reduce((s, sl) => s + sl.value, 0);
    if (total === 0) return <div className="rpt-empty">No data</div>;
    const r = (size - stroke) / 2;
    const cx = size / 2;
    const circ = 2 * Math.PI * r;
    let offset = -0.25;
    const paths = slices.map((sl) => {
        const frac = sl.value / total;
        const dash = frac * circ;
        const rot = offset * 360;
        offset += frac;
        return { ...sl, dash, gap: circ - dash, rot };
    });

    return (
        <div className="rpt-donut-wrap" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                {paths.map((p, i) => (
                    <circle key={i} cx={cx} cy={cx} r={r}
                        fill="none" stroke={p.color} strokeWidth={stroke}
                        strokeDasharray={`${p.dash} ${p.gap}`}
                        style={{ transform: `rotate(${p.rot}deg)`, transformOrigin: `${cx}px ${cx}px` }}
                    />
                ))}
            </svg>
            <div className="rpt-donut-center">
                <span className="rpt-donut-total">{total}</span>
                <span className="rpt-donut-sub">total</span>
            </div>
        </div>
    );
}

/* ── Vertical Bar Chart ──────────────────────────────────── */
function VBarChart({ rows, labelKey, valueKey, colorFn, formatVal, height = 160 }) {
    if (!rows?.length) return <div className="rpt-empty">No data</div>;
    const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);
    const barW = 40, gap = 20, labelH = 32, chartH = height;
    const svgW = rows.length * (barW + gap) + gap;

    return (
        <div className="rpt-vbar-wrap">
            <svg width={svgW} height={chartH + labelH} style={{ overflow: "visible" }}>
                {rows.map((row, i) => {
                    const val = Number(row[valueKey]) || 0;
                    const bH = val > 0 ? Math.max((val / max) * chartH, 6) : 0;
                    const x = gap + i * (barW + gap);
                    const y = chartH - bH;
                    const color = colorFn ? colorFn(row[labelKey]) : PALETTE[i % PALETTE.length];
                    return (
                        <g key={i}>
                            <rect x={x} y={0} width={barW} height={chartH} fill="var(--surface-sunken)" rx={6} />
                            {bH > 0 && (
                                <rect x={x} y={y} width={barW} height={bH} fill={color} rx={6}>
                                    <title>{titleCase(row[labelKey])}: {formatVal ? formatVal(val) : val}</title>
                                </rect>
                            )}
                            {val > 0 && (
                                <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                                    fontSize={10} fill="var(--ink-600)" fontFamily="var(--font-body)" fontWeight={600}>
                                    {formatVal ? formatVal(val) : val}
                                </text>
                            )}
                            <text x={x + barW / 2} y={chartH + 18} textAnchor="middle"
                                fontSize={11} fill="var(--ink-400)" fontFamily="var(--font-body)">
                                {titleCase(row[labelKey]).slice(0, 10)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/* ── Pie with Legend ─────────────────────────────────────── */
function PieWithLegend({ slices }) {
    if (!slices?.length) return <div className="rpt-empty">No data</div>;
    const total = slices.reduce((s, sl) => s + sl.value, 0);
    if (total === 0) return <div className="rpt-empty">No data</div>;
    return (
        <div className="rpt-pie-row">
            <DonutChart slices={slices} size={148} stroke={26} />
            <ul className="rpt-legend">
                {slices.map((sl, i) => (
                    <li key={i} className="rpt-legend-item">
                        <span className="rpt-legend-dot" style={{ background: sl.color }} />
                        <span className="rpt-legend-label">{titleCase(sl.label)}</span>
                        <span className="rpt-legend-val">{sl.value}</span>
                        <span className="rpt-legend-pct">
                            {total ? Math.round((sl.value / total) * 100) : 0}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ── Stacked Bar ─────────────────────────────────────────── */
function StackedBar({ segments }) {
    const total = segments.reduce((s, sg) => s + sg.value, 0);
    if (total === 0) return <div className="rpt-empty">No data</div>;
    return (
        <div className="rpt-stacked-wrap">
            <div className="rpt-stacked-bar">
                {segments.map((sg, i) => (
                    <div key={i} className="rpt-stacked-seg"
                        style={{ width: `${(sg.value / total) * 100}%`, background: sg.color }}
                        title={`${titleCase(sg.label)}: ${sg.value}`}
                    />
                ))}
            </div>
            <ul className="rpt-legend rpt-legend-inline">
                {segments.map((sg, i) => (
                    <li key={i} className="rpt-legend-item">
                        <span className="rpt-legend-dot" style={{ background: sg.color }} />
                        <span className="rpt-legend-label">{titleCase(sg.label)}</span>
                        <span className="rpt-legend-val">{sg.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ── Stat Card ───────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, icon }) {
    return (
        <div className="rpt-stat-card" style={accent ? { borderTop: `3px solid ${accent}` } : undefined}>
            {icon && <div className="rpt-stat-icon" style={{ background: accent + "18", color: accent }}>{icon}</div>}
            <div className="rpt-stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
            <div className="rpt-stat-label">{label}</div>
            {sub && <div className="rpt-stat-sub">{sub}</div>}
        </div>
    );
}

/* ── Chart Card Wrapper ──────────────────────────────────── */
function ChartCard({ title, subtitle, accent, children, span }) {
    return (
        <div className="rpt-card" style={span ? { gridColumn: `span ${span}` } : undefined}>
            <div className="rpt-card-header" style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}>
                <div>
                    <h3 className="rpt-card-title">{title}</h3>
                    {subtitle && <p className="rpt-card-subtitle">{subtitle}</p>}
                </div>
            </div>
            <div className="rpt-card-body">{children}</div>
        </div>
    );
}

function Skeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[80, 60, 90, 50, 70].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 4 }} />
            ))}
        </div>
    );
}

/* ── Main Reports Page ───────────────────────────────────── */
export default function ReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    function loadReports() {
        setLoading(true);
        setError(null);
        Promise.all([
            reportsApi.leadsByStatus(),
            reportsApi.leadsBySource(),
            reportsApi.dealsByStage(),
            reportsApi.salesPerformance(),
            reportsApi.tasksCompletion(),
        ]).then(([statusRes, sourceRes, stageRes, salesRes, tasksRes]) => {
            setData({
                byStatus: (statusRes.data.data || []).map((d) => ({ status: d._id || d.status, count: d.count })),
                bySource: (sourceRes.data.data || []).map((d) => ({ source: d._id || d.source, count: d.count })),
                byStage: (stageRes.data.data || []).map((d) => ({ stage: d.stage_name || d._id, count: d.count, value: d.total_value || 0 })),
                sales: (salesRes.data.data || []).map((d) => ({ rep: d._id || d.assigned_to, won: d.deals_won, value: d.total_value })),
                tasks: (tasksRes.data.data || []).map((d) => ({ status: d._id || d.status, count: d.count })),
            });
        }).catch(() => setError("Failed to load reports. Check your connection."))
          .finally(() => setLoading(false));
    }

    useEffect(loadReports, []);

    const totalLeads = data ? sum(data.byStatus, "count") : 0;
    const totalDeals = data ? sum(data.byStage, "count") : 0;
    const totalDealVal = data ? sum(data.byStage, "value") : 0;
    const totalTasks = data ? sum(data.tasks, "count") : 0;
    const doneTasks = data ? (data.tasks.find((t) => t.status === "completed")?.count || 0) : 0;

    const statusSlices = data?.byStatus.map((d, i) => ({
        label: d.status, value: d.count, color: STATUS_COLORS[d.status] || PALETTE[i % PALETTE.length],
    })) || [];

    const sourceSlices = data?.bySource.map((d, i) => ({
        label: d.source || "Unknown", value: d.count, color: PALETTE[i % PALETTE.length],
    })) || [];

    const taskSegments = data?.tasks.map((d) => ({
        label: d.status, value: d.count, color: TASK_COLORS[d.status] || "#94A3B8",
    })) || [];

    const sortedSales = [...(data?.sales || [])].sort((a, b) => b.value - a.value);

    return (
        <div className="rpt-page">
            {/* Page header */}
            <div className="page-header">
                <div className="page-header-title">
                    <h1>Reports & Analytics</h1>
                    <span className="page-header-subtitle">
                        Performance metrics across leads, deals, and tasks
                    </span>
                </div>
                <div className="page-actions">
                    <button className="btn btn-ghost btn-sm" onClick={loadReports} disabled={loading}>
                        <IconRefresh width={14} height={14} />
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: "14px 18px",
                    background: "var(--accent-red-tint)",
                    border: "1px solid var(--accent-red)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--accent-red)",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <span>{error}</span>
                    <button className="btn btn-sm btn-danger" onClick={loadReports}>Retry</button>
                </div>
            )}

            {/* KPI strip */}
            <div className="rpt-kpi-strip">
                <StatCard label="Total Leads" value={loading ? "—" : totalLeads}
                    accent="#6366F1" icon={<svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path d="M9 6a3 3 0 1 1 6 0A3 3 0 0 1 9 6ZM3.5 9.5A2.5 2.5 0 1 1 8.5 9.5 2.5 2.5 0 0 1 3.5 9.5ZM1 18a4 4 0 0 1 7.75-1.363A5 5 0 0 1 19 18H1Z"/></svg>}
                />
                <StatCard label="Open Deals" value={loading ? "—" : totalDeals}
                    sub={!loading ? formatCurrency(totalDealVal) + " pipeline" : null}
                    accent="#10B981" icon={<svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path fillRule="evenodd" d="M4 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2V6h10a2 2 0 0 0-2-2H4Zm2 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4Zm6 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clipRule="evenodd"/></svg>}
                />
                <StatCard label="Tasks Completed" value={loading ? "—" : `${doneTasks} / ${totalTasks}`}
                    sub={!loading && totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}% completion` : null}
                    accent="#F59E0B" icon={<svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg>}
                />
                <StatCard label="Top Rep Value" value={loading ? "—" : (sortedSales[0] ? formatCurrency(sortedSales[0].value) : "—")}
                    sub={!loading ? sortedSales[0]?.rep || null : null}
                    accent="#8B5CF6" icon={<svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"/></svg>}
                />
            </div>

            {/* Charts grid */}
            <div className="rpt-grid">
                <ChartCard title="Leads by Status" subtitle="Distribution across all pipeline stages" accent="#6366F1">
                    {loading ? <Skeleton /> : <PieWithLegend slices={statusSlices} />}
                </ChartCard>

                <ChartCard title="Leads by Source" subtitle="Where your leads are coming from" accent="#F59E0B">
                    {loading ? <Skeleton /> : <PieWithLegend slices={sourceSlices} />}
                </ChartCard>

                <ChartCard title="Open Deals by Pipeline Stage" subtitle="Count and value of open deals per stage" accent="#10B981" span={2}>
                    {loading ? <Skeleton /> : (
                        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <p className="rpt-chart-label">Deal Count</p>
                                <VBarChart rows={data?.byStage || []} labelKey="stage" valueKey="count" height={140} />
                            </div>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <p className="rpt-chart-label">Pipeline Value</p>
                                <HBarChart rows={data?.byStage || []} labelKey="stage" valueKey="value" formatVal={formatCurrency} />
                            </div>
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Task Status Breakdown" subtitle="Completion health across all tasks" accent="#F97316">
                    {loading ? <Skeleton /> : (
                        <>
                            <StackedBar segments={taskSegments} />
                            <div className="rpt-task-total">
                                <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--ink-900)" }}>
                                    {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
                                </span>
                                <span style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>completion rate</span>
                            </div>
                        </>
                    )}
                </ChartCard>

                <ChartCard title="Sales Performance by Rep" subtitle="Total won deal value per sales representative" accent="#8B5CF6">
                    {loading ? <Skeleton /> : (
                        sortedSales.length ? (
                            <HBarChart rows={sortedSales} labelKey="rep" valueKey="value" formatVal={formatCurrency} colorFn={() => "#8B5CF6"} />
                        ) : (
                            <div className="rpt-empty">No sales data yet</div>
                        )
                    )}
                </ChartCard>
            </div>
        </div>
    );
}
