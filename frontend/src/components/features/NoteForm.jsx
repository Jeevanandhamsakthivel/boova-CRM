import { useState } from "react";
import { workspaceApi } from "../../api/workspaceApi";
import { getErrorMessage } from "../../utils/errorUtils";
import { FieldGroup, TextArea } from "../ui/FormFields";
import { Button } from "../ui/Button";

export function NoteForm({ customerId, onCreated, onCancel }) {
    const [body, setBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!body.trim()) {
            setError("Note body cannot be empty.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await workspaceApi.createNote("customer", customerId, body.trim());
            onCreated(res.data.data);
            setBody("");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FieldGroup label="Note" required error={error}>
                <TextArea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your note here..."
                    rows={6}
                    autoFocus
                />
            </FieldGroup>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" loading={saving}>
                    Save Note
                </Button>
            </div>
        </form>
    );
}
