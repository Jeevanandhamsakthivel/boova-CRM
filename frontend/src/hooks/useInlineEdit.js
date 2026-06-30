import { useState } from "react";
import { workspaceApi } from "../api/workspaceApi";
import { getErrorMessage } from "../utils/errorUtils";

export function useInlineEdit(customerId, onSaved) {
    const [editingField, setEditingField] = useState(null);
    const [draftValue, setDraftValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [fieldError, setFieldError] = useState(null);

    function startEdit(field, currentValue) {
        setEditingField(field);
        setDraftValue(currentValue ?? "");
        setFieldError(null);
    }

    function cancelEdit() {
        setEditingField(null);
        setDraftValue("");
        setFieldError(null);
    }

    async function saveEdit(field, value) {
        setSaving(true);
        setFieldError(null);
        try {
            const res = await workspaceApi.patch(customerId, { [field]: value });
            onSaved(res.data.data);
            setEditingField(null);
        } catch (err) {
            setFieldError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return { editingField, draftValue, setDraftValue, saving, fieldError, startEdit, cancelEdit, saveEdit };
}
