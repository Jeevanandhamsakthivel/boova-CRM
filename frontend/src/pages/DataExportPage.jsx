import { useState } from "react";
import { exportApi } from "../api/exportApi";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";

const EXPORTABLE_COLLECTIONS = [
    "leads", "customers", "companies", "deals", "tasks", "followups",
    "quotes", "invoices", "payments", "tickets", "kb_articles", "meetings",
];

export default function DataExportPage() {
    const toast = useToast();
    const [exporting, setExporting] = useState(null);
    const [fullExporting, setFullExporting] = useState(false);

    async function handleExportAll() {
        setFullExporting(true);
        try {
            const res = await exportApi.all();
            const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `psm-crm-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Full data export downloaded.");
        } catch {
            toast.error("Export failed.");
        } finally {
            setFullExporting(false);
        }
    }

    async function handleExportCSV(collection) {
        setExporting(collection);
        try {
            const res = await exportApi.csv(collection);
            const url = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${collection}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`${collection} exported as CSV.`);
        } catch {
            toast.error(`Failed to export ${collection}.`);
        } finally {
            setExporting(null);
        }
    }

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 0" }}>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 className="page-title">Data Export</h1>
                    <span className="page-header-subtitle">Export your data anytime — no lock-in</span>
                </div>
            </div>

            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Full Data Export</h3>
                <p style={{ color: "var(--ink-400)", fontSize: 13, marginBottom: 16 }}>
                    Export all your CRM data (contacts, deals, files, emails, notes) as a single JSON file.
                    Open format — importable anywhere.
                </p>
                <Button onClick={handleExportAll} disabled={fullExporting}>
                    {fullExporting ? "Exporting..." : "Export All Data (JSON)"}
                </Button>
            </div>

            <div className="card" style={{ padding: 24 }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>Export by Module (CSV)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                    {EXPORTABLE_COLLECTIONS.map(col => (
                        <Button
                            key={col}
                            variant="secondary"
                            onClick={() => handleExportCSV(col)}
                            disabled={exporting === col}
                            style={{ justifyContent: "flex-start" }}
                        >
                            {exporting === col ? "..." : col.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: 24, marginTop: 24, background: "var(--surface-accent)" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: "var(--accent)" }}>No Lock-In Guarantee</h3>
                <p style={{ color: "var(--ink-400)", fontSize: 13 }}>
                    You can export 100% of your data at any time in open formats (JSON, CSV).
                    No contracts. No data hostage situations. Your data is yours.
                </p>
            </div>
        </div>
    );
}
