import { useState } from "react";
import { knowledgeBaseApi } from "../api/knowledgeBaseApi";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/formatters";
import { IconPlus, IconSearch } from "../components/ui/Icons";

export default function KnowledgeBasePage() {
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");

    const { items: articles, meta, loading, reload, updateParams } = usePaginatedList(
        knowledgeBaseApi.list,
        { search, category, page: 1, per_page: 20 }
    );

    function applyFilter(patch) { updateParams({ ...patch, page: 1 }); }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Knowledge Base</h1>
                    <span className="page-header-subtitle">{meta.total_count} articles</span>
                </div>
                <div className="page-actions">
                    <Button onClick={() => setShowCreate(true)}><IconPlus width={14} height={14} /> New Article</Button>
                </div>
            </div>

            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-filters">
                    <div style={{ position: "relative" }}>
                        <IconSearch width={14} height={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
                        <input className="field-input" style={{ width: 240, paddingLeft: 32 }} placeholder="Search articles..." value={search} onChange={e => { setSearch(e.target.value); applyFilter({ search: e.target.value }); }} />
                    </div>
                    <select className="field-select" style={{ width: 150 }} value={category} onChange={e => { setCategory(e.target.value); applyFilter({ category: e.target.value }); }}>
                        <option value="">All categories</option>
                        {["getting_started", "faq", "troubleshooting", "best_practices", "integrations"].map(s => (<option key={s} value={s}>{s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</option>))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : articles.length === 0 ? (
                <div className="empty-state">
                    <h3>No articles found</h3>
                    <p>Create your first knowledge base article.</p>
                    <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}><IconPlus width={14} height={14} /> New Article</Button>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Visibility</th>
                                <th>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 13.5 }}>{a.title}</td>
                                    <td className="cell-muted">{a.category || "—"}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td className="cell-muted">{a.visibility || "—"}</td>
                                    <td className="cell-muted">{formatDate(a.updated_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={meta} onPageChange={p => updateParams({ page: p })} />
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Article" maxWidth={700}>
                <div className="form-layout">
                    <div className="field-group">
                        <label className="field-label">Title</label>
                        <input className="field-input" placeholder="Article title" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Category</label>
                        <select className="field-select">
                            <option value="">Select category</option>
                            {["getting_started", "faq", "troubleshooting", "best_practices", "integrations"].map(s => (<option key={s} value={s}>{s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</option>))}
                        </select>
                    </div>
                    <div className="field-group">
                        <label className="field-label">Content</label>
                        <textarea className="field-input" rows={10} placeholder="Write your article content..." style={{ minHeight: 200 }} />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={() => { toast.success("Article created (demo)."); setShowCreate(false); reload(); }}>Save</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
