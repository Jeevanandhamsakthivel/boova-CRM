import { useState } from "react";
import { tasksApi } from "../../api/tasksApi";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";
import { FieldGroup, TextInput, TextArea, Select, FieldRow } from "../ui/FormFields";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
];
const PRIORITY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

export function TaskFormModal({ initialData = {}, onCreated, onCancel }) {
    const { user } = useAuth();
    const [form, setForm] = useState({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: "",
        assigned_to: user?.id || "",
        related_to_type: initialData.related_to_type || "",
        related_to_id: initialData.related_to_id || "",
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
            const payload = { ...form };
            if (!payload.due_date) delete payload.due_date;
            const res = await tasksApi.create(payload);
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
            <FieldGroup label="Description" error={fieldErrors.description}>
                <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
            </FieldGroup>
            <FieldRow>
                <FieldGroup label="Status" error={fieldErrors.status}>
                    <Select options={STATUS_OPTIONS} value={form.status} onChange={(e) => set("status", e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Priority" error={fieldErrors.priority}>
                    <Select options={PRIORITY_OPTIONS} value={form.priority} onChange={(e) => set("priority", e.target.value)} />
                </FieldGroup>
            </FieldRow>
            <FieldRow>
                <FieldGroup label="Due Date" error={fieldErrors.due_date}>
                    <TextInput type="datetime-local" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Assigned To" required error={fieldErrors.assigned_to}>
                    <TextInput value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} required />
                </FieldGroup>
            </FieldRow>
            {error && <p className="field-error">{error}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" loading={saving}>Create Task</Button>
            </div>
        </form>
    );
}
