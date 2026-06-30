import { useState, useEffect } from "react";
import { pricingApi } from "../api/pricingApi";
import { formatCurrency } from "../utils/formatters";

const PLAN_ORDER = ["free", "starter", "professional", "enterprise"];

export default function PricingPage() {
    const [plans, setPlans] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [teamSize, setTeamSize] = useState(5);

    useEffect(() => {
        pricingApi.listPlans().then(res => setPlans(res.data.data));
        pricingApi.costComparison({ team_size: teamSize }).then(res => setComparison(res.data.data));
    }, [teamSize]);

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h1 className="page-title" style={{ fontSize: 32, margin: 0 }}>Simple, Transparent Pricing</h1>
                <p style={{ color: "var(--ink-400)", marginTop: 8 }}>No hidden fees. No forced annual contracts. Pay only for what you need.</p>
            </div>

            {plans && (
                <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
                    {PLAN_ORDER.map(key => {
                        const plan = plans[key];
                        if (!plan) return null;
                        return (
                            <div key={key} className="card" style={{ textAlign: "center", padding: 24 }}>
                                <h3 style={{ margin: 0, fontSize: 18 }}>{plan.name}</h3>
                                <div style={{ fontSize: 36, fontWeight: 700, color: "var(--accent)", margin: "16px 0" }}>
                                    ${plan.price_monthly}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--ink-400)" }}>/mo</span>
                                </div>
                                <div style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 16 }}>Up to {plan.seats} users</div>
                                <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left", fontSize: 13 }}>
                                    {plan.features.map((f, i) => (
                                        <li key={i} style={{ padding: "4px 0", color: "var(--ink-600)" }}>
                                            <span style={{ color: "var(--success)", marginRight: 6 }}>✓</span>
                                            {f.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}

            {comparison && (
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, margin: "0 0 16px 0" }}>Cost Comparison vs Competitors</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <label>Team Size:</label>
                        <input className="field-input" type="number" style={{ width: 80 }} value={teamSize} onChange={e => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))} />
                    </div>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Provider</th>
                                    <th>Estimated Annual Cost</th>
                                    <th>Savings vs PSM CRM</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ background: "var(--surface-accent)" }}>
                                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>PSM CRM</td>
                                    <td style={{ fontWeight: 600, color: "var(--success)" }}>{formatCurrency(comparison.psm_crm.estimated_cost)}</td>
                                    <td>—</td>
                                </tr>
                                {Object.entries(comparison.competitors).map(([key, cmp]) => (
                                    <tr key={key}>
                                        <td>{cmp.name}</td>
                                        <td style={{ fontWeight: 600, color: "var(--danger)" }}>{formatCurrency(cmp.estimated_cost)}</td>
                                        <td style={{ color: "var(--success)", fontWeight: 600 }}>
                                            Save {formatCurrency(comparison.savings[key])}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
