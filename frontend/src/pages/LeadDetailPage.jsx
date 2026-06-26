import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leadsApi } from "../api/leadsApi";

const FIELDS = [
    ["name", "Name"], ["email", "Email"], ["phone", "Phone"],
    ["company", "Company"], ["source", "Source"], ["status", "Status"],
    ["temperature", "Temperature"], ["notes", "Notes"],
];

export default function LeadDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        leadsApi.get(id)
            .then(r => { const d = r.data.data; setLead(d); setForm(d); })
            .catch(() => navigate("/leads"))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    async function handleSave() {
        setSaving(true);
        setError("");
        try {
            const r = await leadsApi.update(id, form);
            setLead(r.data.data);
            setEditing(false);
        } catch (err) {
            setError(err?.response?.data?.message || "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Delete this lead?")) return;
        await leadsApi.remove(id);
        navigate("/leads");
    }

    if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
    if (!lead) return null;

    return (
        <div style={{ maxWidth: 680 }}>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>{lead.name}</h1>
                    <span className="page-header-subtitle">{lead.company || "No company"}</span>
                </div>
                <div className="page-actions">
                    {editing ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(lead); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="badge badge-danger" style={{ marginBottom: 16, borderRadius: 6 }}>{error}</div>}

            <div className="card card-pad">
                {editing ? (
                    <div>
                        {FIELDS.map(([key, label]) => (
                            <div className="field-group" key={key}>
                                <label className="field-label">{label}</label>
                                {key === "notes" ? (
                                    <textarea className="field-textarea" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                                ) : key === "status" ? (
                                    <select className="field-select" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                                        {["new", "contacted", "qualified", "unqualified", "converted", "lost"].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                ) : key === "temperature" ? (
                                    <select className="field-select" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                                        <option value="">—</option>
                                        {["hot", "warm", "cold"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                ) : (
                                    <input className="field-input" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                        {FIELDS.map(([key, label]) => (
                            <div key={key} style={{ display: "flex", gap: 12 }}>
                                <span style={{ minWidth: 120, color: "var(--ink-400)", fontSize: 13, fontWeight: 600 }}>{label}</span>
                                <span style={{ color: "var(--ink-800)", fontSize: 13 }}>{lead[key] || "—"}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
