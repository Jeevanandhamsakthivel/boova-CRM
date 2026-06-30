import { useState } from "react";
import { ticketsApi } from "../../api/ticketsApi";
import { Button } from "../ui/Button";

export function TicketFormModal({ initialData, onCreated, onCancel }) {
    const [form, setForm] = useState({
        subject: "", description: "", priority: "medium", channel: "email",
        category: "", ...initialData,
    });
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.subject.trim()) return;
        setSaving(true);
        try {
            const res = await ticketsApi.create(form);
            onCreated(res.data.data);
        } catch {
            setSaving(false);
        }
    }

    function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

    return (
        <form onSubmit={handleSubmit} className="form-layout">
            <div className="field-group">
                <label className="field-label">Subject *</label>
                <input className="field-input" value={form.subject} onChange={e => update("subject", e.target.value)} placeholder="Ticket subject" required />
            </div>
            <div className="field-row">
                <div className="field-group">
                    <label className="field-label">Priority</label>
                    <select className="field-select" value={form.priority} onChange={e => update("priority", e.target.value)}>
                        {["low", "medium", "high", "urgent"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                </div>
                <div className="field-group">
                    <label className="field-label">Channel</label>
                    <select className="field-select" value={form.channel} onChange={e => update("channel", e.target.value)}>
                        {["email", "whatsapp", "phone", "chat", "web", "portal"].map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                    </select>
                </div>
            </div>
            <div className="field-group">
                <label className="field-label">Category</label>
                <input className="field-input" value={form.category} onChange={e => update("category", e.target.value)} placeholder="e.g. billing, technical" />
            </div>
            <div className="field-group">
                <label className="field-label">Description</label>
                <textarea className="field-input" rows={4} value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe the issue..." />
            </div>
            <div className="form-actions">
                <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" disabled={saving || !form.subject.trim()}>{saving ? "Saving..." : "Create Ticket"}</Button>
            </div>
        </form>
    );
}
