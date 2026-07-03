import { useEffect, useState } from "react";
import { settingsApi } from "../api/miscApi";
import { emailApi } from "../api/emailApi";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

function SMTPSection() {
    const toast = useToast();
    const [cfg, setCfg] = useState({
        smtp_host: "", smtp_port: "587", smtp_user: "", smtp_password: "",
        smtp_from_name: "", smtp_from_email: "",
    });
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        settingsApi.list({ scope: "user" })
            .then(r => {
                const items = r.data.data || [];
                const map = {};
                items.forEach(s => { map[s.key] = s.value; });
                setCfg(prev => ({
                    smtp_host: map.smtp_host || "",
                    smtp_port: String(map.smtp_port || "587"),
                    smtp_user: map.smtp_user || "",
                    smtp_password: "",
                    smtp_from_name: map.smtp_from_name || "",
                    smtp_from_email: map.smtp_from_email || "",
                }));
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    function setField(key, value) {
        setCfg(f => ({ ...f, [key]: value }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const fields = [
                "smtp_host", "smtp_port", "smtp_user", "smtp_from_name", "smtp_from_email",
            ];
            if (cfg.smtp_password) fields.push("smtp_password");
            for (const key of fields) {
                await settingsApi.upsert({ key, value: cfg[key], scope: "user" });
            }
            toast.success("SMTP settings saved.");
        } catch {
            toast.error("Failed to save SMTP settings.");
        } finally {
            setSaving(false);
        }
    }

    async function handleTest() {
        setTesting(true);
        try {
            const res = await emailApi.sendTest();
            toast.success(res.data?.message || "Test email sent.");
        } catch {
            toast.error("Test failed. Check your SMTP settings.");
        } finally {
            setTesting(false);
        }
    }

    if (!loaded) {
        return <div className="spinner" style={{ width: 24, height: 24, margin: "24px auto" }} />;
    }

    return (
        <div className="automation-card" style={{ marginBottom: 20 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-hairline)" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)", margin: 0 }}>SMTP Configuration</h3>
                <p style={{ fontSize: 13, color: "var(--ink-400)", margin: "4px 0 0" }}>
                    Your personal SMTP server settings for sending emails
                </p>
            </div>
            <div style={{ padding: "16px 20px" }}>
                <div className="form-layout" style={{ gap: 14 }}>
                    <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="field-label">SMTP Host</label>
                        <input className="field-input" placeholder="smtp.example.com"
                            value={cfg.smtp_host} onChange={e => setField("smtp_host", e.target.value)} />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Port</label>
                        <input className="field-input" placeholder="587"
                            value={cfg.smtp_port} onChange={e => setField("smtp_port", e.target.value)} />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Username</label>
                        <input className="field-input" placeholder="user@example.com"
                            value={cfg.smtp_user} onChange={e => setField("smtp_user", e.target.value)} />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <input className="field-input" type="password" placeholder="(leave blank to keep current)"
                            value={cfg.smtp_password} onChange={e => setField("smtp_password", e.target.value)} />
                    </div>
                    <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="field-label">From Name</label>
                        <input className="field-input" placeholder="Your Name"
                            value={cfg.smtp_from_name} onChange={e => setField("smtp_from_name", e.target.value)} />
                    </div>
                    <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="field-label">From Email</label>
                        <input className="field-input" placeholder="you@example.com"
                            value={cfg.smtp_from_email} onChange={e => setField("smtp_from_email", e.target.value)} />
                    </div>
                </div>
                <div className="form-actions" style={{ marginTop: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={testing}>
                        {testing ? "Sending…" : "Test Connection"}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Save SMTP Settings"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
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
                    <span className="page-header-subtitle">System configuration & preferences</span>
                </div>
            </div>

            <SMTPSection />

            <div className="automation-card" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 4px" }}>Appearance</h3>
                        <p style={{ fontSize: 13, color: "var(--ink-400)", margin: 0 }}>
                            Switch between light and dark mode
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 500 }}>
                            {theme === "dark" ? "Dark" : "Light"}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={toggleTheme}
                            style={{ minWidth: 80 }}
                        >
                            {theme === "dark" ? "Light mode" : "Dark mode"}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : settings.length === 0 ? (
                <div className="empty-state"><h3>No settings configured</h3></div>
            ) : (
                <div className="card" style={{ marginTop: 20 }}>
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
