import { useState } from "react";
import { followupsApi } from "../../api/followupsApi";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const TYPE_OPTIONS = [
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "meeting", label: "Meeting" },
    { value: "other", label: "Other" },
];

export function FollowUpFormModal({ initialData = {}, onCreated, onCancel }) {
    const { user } = useAuth();
    const [form, setForm] = useState({
        title: "",
        type: "call",
        description: "",
        due_date: "",
        assigned_to: user?.id || "",
        related_to_type: initialData.related_to_type || "customer",
        related_to_id: initialData.related_to_id || "",
        reminder_minutes_before: 30,
        ...initialData,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    function set(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setFieldErrors({});
        try {
            const res = await followupsApi.create(form);
            onCreated(res.data.data);
        } catch (err) {
            setError(getErrorMessage(err));
            setFieldErrors(getFieldErrors(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FieldGroup label="Title" required error={fieldErrors.title}>
                <TextInput value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </FieldGroup>
            <FieldRow>
                <FieldGroup label="Type" error={fieldErrors.type}>
                    <Select options={TYPE_OPTIONS} value={form.type} onChange={(e) => set("type", e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Due Date" required error={fieldErrors.due_date}>
                    <TextInput type="datetime-local" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} required />
                </FieldGroup>
            </FieldRow>
            <FieldGroup label="Assigned To" required error={fieldErrors.assigned_to}>
                <TextInput value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="Description" error={fieldErrors.description}>
                <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
            </FieldGroup>
            {error && <p className="field-error">{error}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" loading={saving}>Schedule Follow-up</Button>
            </div>
        </form>
    );
}
