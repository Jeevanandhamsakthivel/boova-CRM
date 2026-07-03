import { useRef, useState } from "react";
import { workspaceApi } from "../../../api/workspaceApi";
import { useTabLoad } from "../../../hooks/useTabLoad";
import { Spinner } from "../../ui/Misc";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { formatDate } from "../../../utils/formatters";
import { getErrorMessage } from "../../../utils/errorUtils";
import { useToast } from "../../../context/ToastContext";
import { IconTrash, IconPlus } from "../../ui/Icons";

const ACCEPTED_EXTS  = ".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.csv";
const MAX_SIZE        = 25 * 1024 * 1024;
const ACCEPTED_TYPES  = ["pdf","docx","xlsx","png","jpg","jpeg","csv"];

export function validateFile(file) {
    if (file.size > MAX_SIZE)
        return { valid: false, error: "File exceeds the 25 MB size limit." };
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext))
        return { valid: false, error: "Unsupported type. Accepted: PDF, DOCX, XLSX, PNG, JPG, CSV." };
    return { valid: true };
}

const FILE_ICONS = {
    pdf:  "📄", docx: "📝", xlsx: "📊",
    png:  "🖼️", jpg:  "🖼️", jpeg: "🖼️", csv: "📊",
};

function fileIcon(filename = "") {
    const ext = filename.split(".").pop()?.toLowerCase();
    return FILE_ICONS[ext] || "📎";
}

function formatSize(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesTab({ customerId, activeTab, canWrite }) {
    const toast       = useToast();
    const inputRef    = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadErr, setUploadErr] = useState(null);

    const { items, setItems, loading, error, reload } = useTabLoad(
        "files",
        activeTab,
        () => workspaceApi.listFiles(customerId)
    );

    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        const v = validateFile(file);
        if (!v.valid) { setUploadErr(v.error); return; }
        setUploadErr(null);

        const placeholder = {
            id: `__ph_${Date.now()}`,
            filename: file.name,
            size_bytes: file.size,
            created_at: new Date().toISOString(),
            __pending: true,
        };
        setItems((prev) => [placeholder, ...prev]);
        setUploading(true);

        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await workspaceApi.uploadFile(customerId, fd);
            setItems((prev) => [res.data.data, ...prev.filter((f) => !f.__pending)]);
            toast.success("File uploaded.");
        } catch (err) {
            setItems((prev) => prev.filter((f) => !f.__pending));
            toast.error(getErrorMessage(err));
        } finally {
            setUploading(false);
        }
    }

    const [confirmDeleteFile, setConfirmDeleteFile] = useState(null);

    async function handleDelete() {
        const file = confirmDeleteFile;
        setConfirmDeleteFile(null);
        setItems((prev) => prev.filter((f) => f.id !== file.id));
        try {
            await workspaceApi.deleteFile(customerId, file.id);
            toast.success("File deleted.");
        } catch (err) {
            setItems((prev) => [file, ...prev]);
            toast.error(getErrorMessage(err));
        }
    }

    if (loading) return <div className="ws-tab-loading"><Spinner /></div>;
    if (error)   return (
        <div className="ws-tab-error">
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={reload}>Retry</button>
        </div>
    );

    const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

    return (
        <div className="ws-tab-content">
            {/* Toolbar */}
            <div className="ws-files-toolbar">
                {canWrite && (
                    <>
                        <input ref={inputRef} type="file" accept={ACCEPTED_EXTS} style={{ display: "none" }} onChange={handleFileChange} />
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                            <IconPlus width={13} height={13} />
                            {uploading ? "Uploading…" : "Upload File"}
                        </button>
                        <span className="field-hint">PDF, DOCX, XLSX, PNG, JPG, CSV · max 25 MB</span>
                    </>
                )}
                {uploadErr && <span className="field-error">{uploadErr}</span>}
            </div>

            {/* File list */}
            {items.length === 0 ? (
                <div className="ws-empty-msg" style={{ borderRadius: "0 0 var(--radius-md) var(--radius-md)", borderTop: "none" }}>
                    No files attached yet.
                </div>
            ) : (
                <div className="ws-list" style={{ borderRadius: "0 0 var(--radius-md) var(--radius-md)", borderTop: "none" }}>
                    {items.map((file) => (
                        <div key={file.id} className={`ws-file-row${file.__pending ? " ws-row-pending" : ""}`}>
                            <div className="ws-file-icon">{fileIcon(file.filename)}</div>
                            <div className="ws-file-info">
                                {file.__pending ? (
                                    <span className="ws-file-name" style={{ color: "var(--ink-400)", cursor: "default" }}>
                                        {file.filename} <Spinner size={11} style={{ display: "inline" }} />
                                    </span>
                                ) : (
                                    <a
                                        href={`${BASE}/files/${file.storage_key}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ws-file-name"
                                    >
                                        {file.filename}
                                    </a>
                                )}
                                <div className="ws-file-meta">
                                    <span>{formatSize(file.size_bytes)}</span>
                                    <span>·</span>
                                    <span>{formatDate(file.created_at)}</span>
                                    {file.uploaded_by && <><span>·</span><span>{file.uploaded_by}</span></>}
                                </div>
                            </div>
                            {canWrite && !file.__pending && (
                                <button
                                    className="btn btn-ghost btn-icon btn-sm"
                                    onClick={() => setConfirmDeleteFile(file)}
                                    title="Delete file"
                                    style={{ color: "var(--danger)", flexShrink: 0 }}
                                >
                                    <IconTrash width={14} height={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!confirmDeleteFile}
                title="Delete File?"
                message={confirmDeleteFile ? `Permanently delete "${confirmDeleteFile.filename}"?` : ""}
                confirmLabel="Delete"
                danger
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteFile(null)}
            />
        </div>
    );
}
