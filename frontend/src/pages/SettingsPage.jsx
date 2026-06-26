import { useEffect, useState } from "react";
import { settingsApi } from "../api/miscApi";

export default function SettingsPage() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editKey, setEditKey] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);

    function load() {
        setLoading(true);
        settingsApi.list()
            .then(r => setSettings(r.data.data || []))
            .catch(() => setSettings([]))
            .finally(() => setLoading(false));
    }

    useEffect(load, []);

    async function handleSave(key) {
        setSaving(true);
        try {
            await settingsApi.upsert({ key, value: editValue });
            setEditKey(null);
            load();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ maxWidth: 720 }}>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Settings</h1>
                    <span className="page-header-subtitle">System configuration</span>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : settings.length === 0 ? (
                <div className="empty-state"><h3>No settings configured</h3></div>
            ) : (
                <div className="card">
                    {settings.map((s, i) => (
                        <div key={s.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < settings.length - 1 ? "1px solid var(--border-hairline)" : "none" }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-800)" }}>{s.key}</div>
                                {s.description && <div className="text-muted text-sm">{s.description}</div>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {editKey === s.key ? (
                                    <>
                                        <input className="field-input" style={{ width: 200 }} value={editValue} onChange={e => setEditValue(e.target.value)} />
                                        <button className="btn btn-primary btn-sm" onClick={() => handleSave(s.key)} disabled={saving}>{saving ? "…" : "Save"}</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditKey(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: 13, color: "var(--ink-600)" }}>{s.value ?? "—"}</span>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditKey(s.key); setEditValue(s.value ?? ""); }}>Edit</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
