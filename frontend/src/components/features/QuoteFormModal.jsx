import { useState } from "react";
import { quotesApi } from "../../api/quotesApi";
import { Button } from "../ui/Button";

export function QuoteFormModal({ initialData, onCreated, onCancel }) {
    const [form, setForm] = useState({
        title: "", customer_id: "", total: 0, currency: "USD", status: "draft", notes: "", ...initialData,
    });
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            const res = await quotesApi.create(form);
            onCreated(res.data.data);
        } catch {
            setSaving(false);
        }
    }

    function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

    return (
        <form onSubmit={handleSubmit} className="form-layout">
            <div className="field-group">
                <label className="field-label">Title *</label>
                <input className="field-input" value={form.title} onChange={e => update("title", e.target.value)} placeholder="Quote title" required />
            </div>
            <div className="field-row">
                <div className="field-group">
                    <label className="field-label">Total</label>
                    <input className="field-input" type="number" step="0.01" min="0" value={form.total} onChange={e => update("total", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="field-group">
                    <label className="field-label">Currency</label>
                    <select className="field-select" value={form.currency} onChange={e => update("currency", e.target.value)}>
                        {["USD", "EUR", "GBP", "INR", "AED", "SGD"].map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                </div>
            </div>
            <div className="field-group">
                <label className="field-label">Notes</label>
                <textarea className="field-input" rows={3} value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Optional notes..." />
            </div>
            <div className="form-actions">
                <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" disabled={saving || !form.title.trim()}>{saving ? "Saving..." : "Create Quote"}</Button>
            </div>
        </form>
    );
}
