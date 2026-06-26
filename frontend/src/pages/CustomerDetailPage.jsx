import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customersApi } from "../api/customersApi";

const FIELDS = [
    ["name", "Name"], ["email", "Email"], ["phone", "Phone"],
    ["company", "Company"], ["address", "Address"], ["notes", "Notes"],
];

export default function CustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        customersApi.get(id)
            .then(r => { const d = r.data.data; setCustomer(d); setForm(d); })
            .catch(() => navigate("/customers"))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    async function handleSave() {
        setSaving(true);
        try {
            const r = await customersApi.update(id, form);
            setCustomer(r.data.data);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Delete this customer?")) return;
        await customersApi.remove(id);
        navigate("/customers");
    }

    if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
    if (!customer) return null;

    return (
        <div style={{ maxWidth: 680 }}>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>{customer.name}</h1>
                    <span className="page-header-subtitle">{customer.email || "No email"}</span>
                </div>
                <div className="page-actions">
                    {editing ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(customer); }}>Cancel</button>
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

            <div className="card card-pad">
                {editing ? (
                    FIELDS.map(([key, label]) => (
                        <div className="field-group" key={key}>
                            <label className="field-label">{label}</label>
                            {key === "notes" || key === "address" ? (
                                <textarea className="field-textarea" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                            ) : (
                                <input className="field-input" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                        {FIELDS.map(([key, label]) => (
                            <div key={key} style={{ display: "flex", gap: 12 }}>
                                <span style={{ minWidth: 120, color: "var(--ink-400)", fontSize: 13, fontWeight: 600 }}>{label}</span>
                                <span style={{ color: "var(--ink-800)", fontSize: 13 }}>{customer[key] || "—"}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
