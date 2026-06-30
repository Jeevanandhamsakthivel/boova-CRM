import { useState } from "react";
import { companiesApi } from "../../api/companiesApi";
import { Button } from "../ui/Button";

export function CompanyFormModal({ onCreated, onCancel }) {
    const [form, setForm] = useState({ name: "", industry: "", company_size: "", email: "", phone: "", website: "", assigned_to: "" });
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const res = await companiesApi.create(form);
            onCreated(res.data.data);
        } catch {
            setSaving(false);
        }
    }

    function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

    return (
        <form onSubmit={handleSubmit} className="form-layout">
            <div className="field-group">
                <label className="field-label">Name *</label>
                <input className="field-input" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Company name" required />
            </div>
            <div className="field-row">
                <div className="field-group">
                    <label className="field-label">Industry</label>
                    <select className="field-select" value={form.industry} onChange={e => update("industry", e.target.value)}>
                        <option value="">Select</option>
                        {["technology", "finance", "healthcare", "retail", "manufacturing", "real_estate", "education", "consulting", "media", "logistics", "other"].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div className="field-group">
                    <label className="field-label">Size</label>
                    <select className="field-select" value={form.company_size} onChange={e => update("company_size", e.target.value)}>
                        <option value="">Select</option>
                        {["1-10", "11-50", "51-200", "201-1000", "1000+"].map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                </div>
            </div>
            <div className="field-row">
                <div className="field-group">
                    <label className="field-label">Email</label>
                    <input className="field-input" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="company@example.com" />
                </div>
                <div className="field-group">
                    <label className="field-label">Phone</label>
                    <input className="field-input" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
            </div>
            <div className="field-group">
                <label className="field-label">Website</label>
                <input className="field-input" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="form-actions">
                <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" disabled={saving || !form.name.trim()}>{saving ? "Saving..." : "Create Company"}</Button>
            </div>
        </form>
    );
}
