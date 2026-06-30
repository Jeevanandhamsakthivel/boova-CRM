import { useState } from "react";
import { invoicesApi } from "../../api/invoicesApi";
import { Button } from "../ui/Button";

export function InvoiceFormModal({ initialData, onCreated, onCancel }) {
    const [form, setForm] = useState({
        customer_id: "", total: 0, currency: "USD", status: "draft", notes: "", terms: "", ...initialData,
    });
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.total) return;
        setSaving(true);
        try {
            const res = await invoicesApi.create(form);
            onCreated(res.data.data);
        } catch {
            setSaving(false);
        }
    }

    function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

    return (
        <form onSubmit={handleSubmit} className="form-layout">
            <div className="field-group">
                <label className="field-label">Customer ID</label>
                <input className="field-input" value={form.customer_id} onChange={e => update("customer_id", e.target.value)} placeholder="Customer ID" />
            </div>
            <div className="field-row">
                <div className="field-group">
                    <label className="field-label">Total *</label>
                    <input className="field-input" type="number" step="0.01" min="0" value={form.total} onChange={e => update("total", parseFloat(e.target.value) || 0)} required />
                </div>
                <div className="field-group">
                    <label className="field-label">Currency</label>
                    <select className="field-select" value={form.currency} onChange={e => update("currency", e.target.value)}>
                        {["USD", "EUR", "GBP", "INR", "AED", "SGD"].map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                </div>
            </div>
            <div className="field-row">
                <div className="field-group">
                    <label className="field-label">Issue Date</label>
                    <input className="field-input" type="date" value={form.issue_date || ""} onChange={e => update("issue_date", e.target.value)} />
                </div>
                <div className="field-group">
                    <label className="field-label">Due Date</label>
                    <input className="field-input" type="date" value={form.due_date || ""} onChange={e => update("due_date", e.target.value)} />
                </div>
            </div>
            <div className="field-group">
                <label className="field-label">Notes</label>
                <textarea className="field-input" rows={3} value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Optional notes..." />
            </div>
            <div className="field-group">
                <label className="field-label">Terms</label>
                <textarea className="field-input" rows={2} value={form.terms} onChange={e => update("terms", e.target.value)} placeholder="Payment terms..." />
            </div>
            <div className="form-actions">
                <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Invoice"}</Button>
            </div>
        </form>
    );
}
