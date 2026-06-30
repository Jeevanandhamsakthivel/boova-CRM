import { useNavigate } from "react-router-dom";
import { dealsApi } from "../../../api/pipelineApi";
import { useTabLoad } from "../../../hooks/useTabLoad";
import { StatusBadge } from "../../ui/Badge";
import { Spinner } from "../../ui/Misc";
import { formatDate, formatCurrency } from "../../../utils/formatters";

const STATUS_ORDER = { open: 0, won: 1, lost: 2 };

const STATUS_ACCENT = {
    open: "var(--info)",
    won:  "var(--success)",
    lost: "var(--danger)",
};

export function computeDealSummary(deals) {
    const openDeals = deals.filter((d) => d.status === "open");
    const wonDeals  = deals.filter((d) => d.status === "won");
    const openValue = openDeals.reduce((s, d) => s + (d.value || 0), 0);
    const wonValue  = wonDeals.reduce((s,  d) => s + (d.value || 0), 0);
    const counts    = deals.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {});
    const avgWon    = wonDeals.length ? wonValue / wonDeals.length : 0;
    return { openValue, wonValue, counts, avgWon };
}

export function DealsTab({ customerId, activeTab }) {
    const navigate = useNavigate();
    const { items, loading, error, reload } = useTabLoad(
        "deals",
        activeTab,
        () => dealsApi.list({ customer_id: customerId, per_page: 100 })
    );

    if (loading) return <div className="ws-tab-loading"><Spinner /></div>;
    if (error)   return (
        <div className="ws-tab-error">
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={reload}>Retry</button>
        </div>
    );

    const sorted  = [...items].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
    const summary = computeDealSummary(items);

    return (
        <div className="ws-tab-content">
            {/* Summary banner */}
            {items.length > 0 && (
                <div className="ws-deal-summary">
                    <div className="ws-deal-summary-item">
                        <span className="ws-deal-summary-value" style={{ color: "var(--info)" }}>{formatCurrency(summary.openValue)}</span>
                        <span className="ws-deal-summary-label">Open Pipeline</span>
                    </div>
                    <div className="ws-deal-summary-item">
                        <span className="ws-deal-summary-value" style={{ color: "var(--success)" }}>{formatCurrency(summary.wonValue)}</span>
                        <span className="ws-deal-summary-label">Won Value</span>
                    </div>
                    {Object.entries(summary.counts).map(([status, count]) => (
                        <div key={status} className="ws-deal-summary-item">
                            <span className="ws-deal-summary-value">{count}</span>
                            <span className="ws-deal-summary-label" style={{ color: STATUS_ACCENT[status] }}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Deal rows */}
            {sorted.length === 0 ? (
                <div className="ws-empty-msg">No deals yet. Use "+ Deal" to create one.</div>
            ) : (
                <div className="ws-list">
                    {sorted.map((deal) => (
                        <div key={deal.id} className="ws-list-row">
                            {/* Status colour stripe */}
                            <div style={{
                                width: 3,
                                alignSelf: "stretch",
                                borderRadius: 2,
                                background: STATUS_ACCENT[deal.status] || "var(--border-hairline)",
                                flexShrink: 0,
                            }} />

                            <div className="ws-list-row-main">
                                <button className="ws-list-link" onClick={() => navigate("/pipeline")}>
                                    {deal.title}
                                </button>
                                <div className="ws-list-meta">
                                    <StatusBadge status={deal.status} />
                                    <span className="ws-meta-sep" />
                                    <span className="ws-meta-text" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--ink-800)" }}>
                                        {formatCurrency(deal.value)}
                                    </span>
                                    {deal.expected_close_date && (
                                        <>
                                            <span className="ws-meta-sep" />
                                            <span className="ws-meta-text">Closes {formatDate(deal.expected_close_date)}</span>
                                        </>
                                    )}
                                    {deal.assigned_to && (
                                        <>
                                            <span className="ws-meta-sep" />
                                            <span className="ws-meta-text">{deal.assigned_to}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
