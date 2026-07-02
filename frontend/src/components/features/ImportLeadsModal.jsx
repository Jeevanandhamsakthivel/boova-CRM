import { useState, useRef, useCallback } from "react";
import { Button } from "../ui/Button";
import { leadsApi } from "../../api/leadsApi";
import { useToast } from "../../context/ToastContext";
import { IconUpload, IconFile, IconTable, IconX } from "../ui/Icons";

const ACCEPTED_FORMATS = ".csv, .xlsx, .xls";

export function ImportLeadsModal({ onClose, onImported }) {
    const toast = useToast();
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [step, setStep] = useState("select");

    const handleFileSelect = useCallback((e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setStep("preview");
        e.target.value = "";
    }, []);

    const handleImport = useCallback(async () => {
        if (!file) return;
        setImporting(true);
        try {
            const res = await leadsApi.importLeads(file);
            const result = res.data.data;
            toast.success(`${result.imported || result.count || "Leads"} imported successfully.`);
            onImported?.(result);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || "Import failed. Check your file and try again.";
            toast.error(msg);
        } finally {
            setImporting(false);
        }
    }, [file, toast, onClose, onImported]);

    const removeFile = useCallback(() => {
        setFile(null);
        setPreview(null);
        setStep("select");
    }, []);

    return (
        <div className="import-modal">
            {step === "select" && (
                <div className="import-dropzone" onClick={() => fileRef.current?.click()}>
                    <IconUpload width={40} height={40} />
                    <h3>Import Leads from File</h3>
                    <p>Upload a CSV or Excel file to bulk import leads.</p>
                    <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                        <IconUpload width={14} height={14} /> Choose File
                    </Button>
                    <span className="import-hint">Supports .csv, .xlsx, .xls files</span>
                </div>
            )}

            {step === "preview" && file && (
                <div className="import-preview">
                    <div className="import-file-info">
                        <IconFile width={20} height={20} />
                        <div className="import-file-details">
                            <span className="import-file-name">{file.name}</span>
                            <span className="import-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button className="import-file-remove" onClick={removeFile}>
                            <IconX width={14} height={14} />
                        </button>
                    </div>

                    <div className="import-columns-info">
                        <IconTable width={16} height={16} />
                        <span>Leads will be mapped from the file columns to lead fields (name, email, phone, company, etc.)</span>
                    </div>

                    <div className="import-expected-columns">
                        <strong>Expected columns:</strong>
                        <div className="import-tags">
                            {["name", "email", "phone", "company", "job_title", "source", "status", "notes"].map(col => (
                                <span key={col} className="import-tag">{col}</span>
                            ))}
                        </div>
                    </div>

                    <div className="import-actions">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleImport} loading={importing}>
                            {importing ? "Importing..." : `Import ${file.name}`}
                        </Button>
                    </div>
                </div>
            )}

            <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_FORMATS}
                onChange={handleFileSelect}
                style={{ display: "none" }}
            />
        </div>
    );
}
