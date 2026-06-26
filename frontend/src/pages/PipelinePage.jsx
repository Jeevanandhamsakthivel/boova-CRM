import { useEffect, useState } from "react";
import { pipelineApi, dealsApi } from "../api/pipelineApi";

export default function PipelinePage() {
    const [stages, setStages] = useState([]);
    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);

    function loadBoard() {
        setLoading(true);
        Promise.all([pipelineApi.listStages(), pipelineApi.board()])
            .then(([stagesRes, boardRes]) => {
                setStages(stagesRes.data.data || []);
                setBoard(boardRes.data.data || {});
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }

    useEffect(loadBoard, []);

    async function moveDeal(dealId, stageId) {
        await dealsApi.move(dealId, stageId);
        loadBoard();
    }

    if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Pipeline</h1>
                    <span className="page-header-subtitle">Drag deals through stages</span>
                </div>
            </div>

            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
                {stages.map(stage => {
                    const deals = board[stage.id] || board[stage.name] || [];
                    const stageValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
                    return (
                        <div key={stage.id} style={{ minWidth: 240, maxWidth: 240, flexShrink: 0 }}>
                            <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "12px 14px 6px", marginBottom: 8 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-700)", marginBottom: 2 }}>{stage.name}</div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{deals.length} deals · {stageValue > 0 ? `₹${stageValue.toLocaleString()}` : "₹0"}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {deals.length === 0 && (
                                    <div style={{ background: "var(--surface)", border: "2px dashed var(--border-hairline)", borderRadius: "var(--radius-md)", padding: "20px 14px", textAlign: "center", color: "var(--ink-200)", fontSize: 12 }}>
                                        No deals
                                    </div>
                                )}
                                {deals.map(deal => (
                                    <div key={deal.id} className="card card-pad" style={{ cursor: "default" }}>
                                        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{deal.title || deal.name}</div>
                                        {deal.value > 0 && <div style={{ color: "var(--accent-strong)", fontWeight: 700, fontSize: 13 }}>₹{Number(deal.value).toLocaleString()}</div>}
                                        {deal.customer_name && <div className="text-muted text-sm" style={{ marginTop: 4 }}>{deal.customer_name}</div>}
                                        {stages.length > 1 && (
                                            <select
                                                className="field-select"
                                                style={{ marginTop: 10, fontSize: 12 }}
                                                value={stage.id}
                                                onChange={e => moveDeal(deal.id, e.target.value)}
                                            >
                                                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {stages.length === 0 && (
                    <div className="empty-state"><h3>No pipeline stages</h3><p>Create stages in Settings.</p></div>
                )}
            </div>
        </div>
    );
}
