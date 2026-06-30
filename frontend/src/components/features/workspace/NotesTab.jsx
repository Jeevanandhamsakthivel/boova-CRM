import { useState } from "react";
import { customersApi } from "../../../api/customersApi";
import { workspaceApi } from "../../../api/workspaceApi";
import { useTabLoad } from "../../../hooks/useTabLoad";
import { Spinner } from "../../ui/Misc";
import { formatDateTime } from "../../../utils/formatters";
import { getErrorMessage } from "../../../utils/errorUtils";
import { useToast } from "../../../context/ToastContext";
import { IconEdit, IconCheck, IconX } from "../../ui/Icons";

function NoteCard({ note, canWrite }) {
    const toast = useToast();
    const [editing, setEditing] = useState(false);
    const [draft,   setDraft]   = useState(note.description);
    const [saving,  setSaving]  = useState(false);

    async function handleSave() {
        const trimmed = draft.trim();
        if (!trimmed) return;
        setSaving(true);
        try {
            await workspaceApi.updateNote(note.id, trimmed);
            setEditing(false);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={`ws-note-card${canWrite && !editing ? " editable-note" : ""}`}>
            {editing ? (
                <>
                    <textarea
                        className="field-textarea"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={5}
                        autoFocus
                        style={{ marginBottom: 10 }}
                    />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setEditing(false); setDraft(note.description); }}
                        >
                            <IconX width={13} height={13} /> Cancel
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !draft.trim()}>
                            <IconCheck width={13} height={13} /> {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p className="ws-note-body">{note.description}</p>
                    <div className="ws-note-footer">
                        <div className="ws-note-meta">
                            <span className="ws-note-author">{note.created_by || "—"}</span>
                            <span className="ws-meta-sep" style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ink-200)" }} />
                            <span>{formatDateTime(note.created_at)}</span>
                            {note.extra?.edited_at && <span className="ws-note-edited">edited</span>}
                        </div>
                        {canWrite && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditing(true)}
                                style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0.6 }}
                            >
                                <IconEdit width={12} height={12} /> Edit
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export function NotesTab({ customerId, activeTab, canWrite }) {
    const { items, loading, error, reload } = useTabLoad(
        "notes",
        activeTab,
        () => customersApi.activities(customerId, { type: "note", per_page: 100 })
    );

    if (loading) return <div className="ws-tab-loading"><Spinner /></div>;
    if (error)   return (
        <div className="ws-tab-error">
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={reload}>Retry</button>
        </div>
    );

    const sorted = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="ws-tab-content">
            {sorted.length === 0 ? (
                <div className="ws-empty-msg">No notes yet. Use "+ Note" to log one.</div>
            ) : (
                <div className="ws-notes-list">
                    {sorted.map((note) => (
                        <NoteCard key={note.id} note={note} canWrite={canWrite} />
                    ))}
                </div>
            )}
        </div>
    );
}
