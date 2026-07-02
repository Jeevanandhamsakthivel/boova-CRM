import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { workflowTemplatesApi } from "../api/workflowsApi";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination, Spinner } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { titleCase } from "../utils/formatters";
import { IconTemplate, IconPlus, IconCheck, IconActivity } from "../components/ui/Icons";

const INDUSTRY_COLORS = {
    construction: "#F59E0B",
    manufacturing: "#6366F1",
    healthcare: "#10B981",
    education: "#3B82F6",
    retail: "#EC4899",
    software: "#8B5CF6",
    real_estate: "#F97316",
    finance: "#EF4444",
    insurance: "#14B8A6",
    hospitality: "#06B6D4",
    law_firm: "#0EA5E9",
    digital_marketing: "#A855F7",
    logistics: "#F59E0B",
    custom: "#6B7280",
};

export default function WorkflowTemplatesPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        setLoading(true);
        const params = { page, per_page: 20 };
        if (filter) params.category = filter;
        workflowTemplatesApi.list(params)
            .then(res => {
                setTemplates(res.data.data || []);
                setTotal(res.data.meta?.total_count || 0);
            })
            .catch(() => toast.error("Failed to load templates"))
            .finally(() => setLoading(false));
    }, [page, filter, toast]);

    const handleApply = async (template) => {
        setApplying(template.id);
        try {
            const res = await workflowTemplatesApi.apply(template.id);
            toast.success("Template applied! Opening workflow builder...");
            navigate(`/workflows/builder?id=${res.data.data.id}`);
        } catch {
            toast.error("Failed to apply template.");
        } finally {
            setApplying(null);
        }
    };

    const categories = [
        "construction", "manufacturing", "healthcare", "education",
        "retail", "software", "real_estate", "finance", "insurance",
        "hospitality", "law_firm", "digital_marketing", "logistics", "custom",
    ];

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Workflow Templates</h1>
                    <span className="page-header-subtitle">{total} templates</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => workflowTemplatesApi.seed().then(() => { toast.success("Templates seeded."); window.location.reload(); })}>
                        <IconActivity width={14} height={14} /> Seed Templates
                    </Button>
                </div>
            </div>

            <div className="filter-bar" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className={`btn btn-sm ${!filter ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter("")}>All</button>
                    {categories.map(cat => (
                        <button key={cat} className={`btn btn-sm ${filter === cat ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(cat)}>
                            {titleCase(cat)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><Spinner size={28} /></div>
            ) : templates.length === 0 ? (
                <div className="empty-state">
                    <IconTemplate width={40} height={40} />
                    <h3>No templates available</h3>
                    <p>Click "Seed Templates" to load built-in industry templates, or create your own.</p>
                    <Button onClick={() => workflowTemplatesApi.seed().then(() => window.location.reload())} style={{ marginTop: 8 }}>
                        <IconActivity width={14} height={14} /> Seed Templates
                    </Button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {templates.map(tpl => (
                        <div key={tpl.id} className="kpi-card" style={{ padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: 16, paddingBottom: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: `${INDUSTRY_COLORS[tpl.category] || "#6366F1"}18`,
                                        color: INDUSTRY_COLORS[tpl.category] || "#6366F1",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 16, fontWeight: 700,
                                    }}>
                                        {tpl.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", margin: 0 }}>{tpl.name}</h3>
                                        <span style={{ fontSize: 11, color: "var(--ink-400)" }}>{titleCase(tpl.category)} · {tpl.entity_type}</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: 12, color: "var(--ink-500)", margin: 0, lineHeight: 1.4 }}>
                                    {tpl.description || "No description"}
                                </p>
                                <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {(tpl.tags || []).slice(0, 4).map(tag => (
                                        <span key={tag} className="badge badge-sm">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: "var(--ink-400)" }}>{(tpl.nodes || []).length} nodes · {(tpl.stages || []).length} stages</span>
                                <Button size="sm" onClick={() => handleApply(tpl)} disabled={applying === tpl.id}>
                                    {applying === tpl.id ? "Applying..." : "Use Template"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 20 }}>
                <Pagination
                    meta={{ page, per_page: 20, total_count: total, total_pages: Math.ceil(total / 20), has_next: page < Math.ceil(total / 20), has_prev: page > 1 }}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
