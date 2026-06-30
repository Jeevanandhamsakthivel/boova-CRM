import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const UPLOADS_BASE = BASE.replace(/\/api$/, "");

const TIMEZONES = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Europe/Paris",
    "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo",
    "Australia/Sydney", "Pacific/Auckland",
];

const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
    { value: "ar", label: "Arabic" },
    { value: "hi", label: "Hindi" },
];

const DATE_FORMATS = [
    { value: "YYYY-MM-DD", label: "2024-12-31" },
    { value: "DD/MM/YYYY", label: "31/12/2024" },
    { value: "MM/DD/YYYY", label: "12/31/2024" },
    { value: "DD.MM.YYYY", label: "31.12.2024" },
];

const COUNTRIES = [
    "United States", "Canada", "United Kingdom", "Germany", "France",
    "India", "Australia", "Japan", "Brazil", "United Arab Emirates",
    "Singapore", "Netherlands", "Sweden", "Norway", "Switzerland",
];

function avatarUrl(user) {
    if (user?.avatar_url) {
        const u = user.avatar_url;
        if (u.startsWith("http")) return u;
        return `${UPLOADS_BASE}${u}`;
    }
    return null;
}

function initials(name) {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
}

function formatTimestamp(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
}

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const fileRef = useRef(null);

    const [form, setForm] = useState({});
    const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(true);
    const [activeSection, setActiveSection] = useState("personal");

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                job_title: user.job_title || "",
                department: user.department || "",
                bio: user.bio || "",
                address_line1: user.address_line1 || "",
                address_line2: user.address_line2 || "",
                city: user.city || "",
                state: user.state || "",
                zip_code: user.zip_code || "",
                country: user.country || "",
                linkedin: user.linkedin || "",
                github: user.github || "",
                twitter: user.twitter || "",
                website: user.website || "",
                timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                language: user.language || "en",
                date_format: user.date_format || "YYYY-MM-DD",
                notification_preferences: user.notification_preferences || {
                    email_alerts: true,
                    browser_notifications: true,
                    daily_summary: false,
                    sms_alerts: false,
                },
            });
        }
    }, [user]);

    useEffect(() => {
        authApi.getMyAuditLogs({ per_page: 20 })
            .then(res => setAuditLogs(res.data.data || []))
            .catch(() => {})
            .finally(() => setAuditLoading(false));
    }, []);

    function showMsg(text, type = "success") {
        setMsg({ text, type });
        setTimeout(() => setMsg({ type: "", text: "" }), 4000);
    }

    function showPwMsg(text, type = "success") {
        setPwMsg({ text, type });
        setTimeout(() => setPwMsg({ type: "", text: "" }), 4000);
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await authApi.updateMe(form);
            await refreshUser();
            showMsg("Profile updated successfully.");
        } catch (err) {
            showMsg(err?.response?.data?.message || "Update failed.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleAvatarUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await authApi.uploadAvatar(file);
            await refreshUser();
            showMsg("Avatar updated.");
        } catch (err) {
            showMsg(err?.response?.data?.message || "Avatar upload failed.", "error");
        } finally {
            setUploading(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        if (pwForm.new_password !== pwForm.confirm) {
            showPwMsg("Passwords don't match.", "error");
            return;
        }
        if (pwForm.new_password.length < 8) {
            showPwMsg("Password must be at least 8 characters.", "error");
            return;
        }
        setChangingPw(true);
        try {
            await authApi.changePassword({
                current_password: pwForm.current_password,
                new_password: pwForm.new_password,
            });
            showPwMsg("Password changed successfully.");
            setPwForm({ current_password: "", new_password: "", confirm: "" });
        } catch (err) {
            showPwMsg(err?.response?.data?.message || "Failed to change password.", "error");
        } finally {
            setChangingPw(false);
        }
    }

    function update(field, value) {
        setForm(f => ({ ...f, [field]: value }));
    }

    const sections = [
        { key: "personal", label: "Personal", icon: "👤" },
        { key: "contact", label: "Contact", icon: "📍" },
        { key: "professional", label: "Social", icon: "🔗" },
        { key: "preferences", label: "Preferences", icon: "⚙️" },
        { key: "security", label: "Security", icon: "🔒" },
    ];

    const avUrl = avatarUrl(user);

    const styleLabel = { fontSize: 12, fontWeight: 600, color: "var(--ink-500)", marginBottom: 4, display: "block" };
    const styleInput = {
        width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 6,
        border: "1px solid var(--border)", background: "var(--surface)",
        color: "var(--ink-900)", outline: "none", fontFamily: "var(--font-body)",
        boxSizing: "border-box",
    };
    const styleSelect = { ...styleInput, cursor: "pointer" };
    const styleTextarea = { ...styleInput, resize: "vertical", minHeight: 64 };
    const styleRow = { display: "flex", gap: 12, marginBottom: 14 };
    const styleField = { flex: 1, minWidth: 0 };
    const styleCard = {
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16,
    };
    const styleSectionTitle = {
        fontSize: 15, fontWeight: 700, margin: "0 0 18px",
        color: "var(--ink-900)", fontFamily: "var(--font-display)",
    };
    const styleTab = (active) => ({
        padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        cursor: "pointer", border: "none", fontFamily: "var(--font-body)",
        background: active ? "var(--accent)" : "var(--surface-sunken)",
        color: active ? "#fff" : "var(--ink-600)",
        transition: "all 0.15s",
    });

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>My Profile</h1>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--ink-400)" }}>
                        Manage your account, preferences, and security settings
                    </p>
                </div>
            </div>

            {msg.text && (
                <div style={{
                    padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13,
                    background: msg.type === "error" ? "var(--danger-tint, #fef2f2)" : "var(--success-tint, #f0fdf4)",
                    color: msg.type === "error" ? "var(--danger, #dc2626)" : "var(--success, #16a34a)",
                    border: `1px solid ${msg.type === "error" ? "var(--danger, #dc2626)" : "var(--success, #16a34a)"}20`,
                }}>
                    {msg.text}
                </div>
            )}

            {/* Avatar + Identity */}
            <div style={styleCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                        {avUrl ? (
                            <img src={avUrl} alt="avatar" style={{
                                width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
                                border: "2px solid var(--border)",
                            }} />
                        ) : (
                            <div style={{
                                width: 72, height: 72, borderRadius: "50%",
                                background: "var(--accent)", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)",
                            }}>
                                {initials(user?.name)}
                            </div>
                        )}
                        <div style={{
                            position: "absolute", bottom: 0, right: 0,
                            background: "var(--accent)", color: "#fff",
                            width: 24, height: 24, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, border: "2px solid var(--surface)",
                        }}>
                            {uploading ? "..." : "📷"}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                            onChange={handleAvatarUpload} />
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-900)" }}>
                            {user?.name || user?.email}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink-400)", marginTop: 2 }}>
                            {user?.email}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                            <span className="badge badge-accent" style={{ fontSize: 11 }}>
                                {user?.role}
                            </span>
                            {user?.job_title && (
                                <span style={{ fontSize: 12, color: "var(--ink-500)" }}>
                                    {user.job_title}{user?.department ? ` · ${user.department}` : ""}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {sections.map(s => (
                    <button key={s.key} style={styleTab(activeSection === s.key)}
                        onClick={() => setActiveSection(s.key)}>
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

            {/* Personal Information */}
            {activeSection === "personal" && (
                <form onSubmit={handleSave}>
                    <div style={styleCard}>
                        <h3 style={styleSectionTitle}>Personal Information</h3>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>Full Name</label>
                                <input style={styleInput} value={form.name}
                                    onChange={e => update("name", e.target.value)} />
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>Email</label>
                                <input style={styleInput} type="email" value={form.email} disabled
                                    onChange={e => update("email", e.target.value)} />
                            </div>
                        </div>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>Phone</label>
                                <input style={styleInput} type="tel" value={form.phone}
                                    onChange={e => update("phone", e.target.value)} />
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>Job Title</label>
                                <input style={styleInput} value={form.job_title}
                                    onChange={e => update("job_title", e.target.value)} />
                            </div>
                        </div>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>Department</label>
                                <input style={styleInput} value={form.department}
                                    onChange={e => update("department", e.target.value)} />
                            </div>
                            <div style={styleField} />
                        </div>
                        <div className="field-group">
                            <label style={styleLabel}>Bio</label>
                            <textarea style={styleTextarea} rows={3} value={form.bio}
                                onChange={e => update("bio", e.target.value)}
                                placeholder="Brief description about yourself…" />
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            )}

            {/* Contact Information */}
            {activeSection === "contact" && (
                <form onSubmit={handleSave}>
                    <div style={styleCard}>
                        <h3 style={styleSectionTitle}>Contact Information</h3>
                        <div className="field-group">
                            <label style={styleLabel}>Address Line 1</label>
                            <input style={styleInput} value={form.address_line1}
                                onChange={e => update("address_line1", e.target.value)}
                                placeholder="Street address, P.O. box" />
                        </div>
                        <div className="field-group">
                            <label style={styleLabel}>Address Line 2</label>
                            <input style={styleInput} value={form.address_line2}
                                onChange={e => update("address_line2", e.target.value)}
                                placeholder="Apartment, suite, unit, building" />
                        </div>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>City</label>
                                <input style={styleInput} value={form.city}
                                    onChange={e => update("city", e.target.value)} />
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>State / Province</label>
                                <input style={styleInput} value={form.state}
                                    onChange={e => update("state", e.target.value)} />
                            </div>
                        </div>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>ZIP / Postal Code</label>
                                <input style={styleInput} value={form.zip_code}
                                    onChange={e => update("zip_code", e.target.value)} />
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>Country</label>
                                <select style={styleSelect} value={form.country}
                                    onChange={e => update("country", e.target.value)}>
                                    <option value="">Select country</option>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            )}

            {/* Professional / Social */}
            {activeSection === "professional" && (
                <form onSubmit={handleSave}>
                    <div style={styleCard}>
                        <h3 style={styleSectionTitle}>Professional Links</h3>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>LinkedIn</label>
                                <input style={styleInput} value={form.linkedin}
                                    onChange={e => update("linkedin", e.target.value)}
                                    placeholder="https://linkedin.com/in/username" />
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>GitHub</label>
                                <input style={styleInput} value={form.github}
                                    onChange={e => update("github", e.target.value)}
                                    placeholder="https://github.com/username" />
                            </div>
                        </div>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>Twitter / X</label>
                                <input style={styleInput} value={form.twitter}
                                    onChange={e => update("twitter", e.target.value)}
                                    placeholder="https://twitter.com/username" />
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>Website</label>
                                <input style={styleInput} value={form.website}
                                    onChange={e => update("website", e.target.value)}
                                    placeholder="https://example.com" />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            )}

            {/* Preferences */}
            {activeSection === "preferences" && (
                <form onSubmit={handleSave}>
                    <div style={styleCard}>
                        <h3 style={styleSectionTitle}>Preferences</h3>
                        <div style={styleRow}>
                            <div style={styleField}>
                                <label style={styleLabel}>Language</label>
                                <select style={styleSelect} value={form.language}
                                    onChange={e => update("language", e.target.value)}>
                                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>Timezone</label>
                                <select style={styleSelect} value={form.timezone}
                                    onChange={e => update("timezone", e.target.value)}>
                                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </div>
                            <div style={styleField}>
                                <label style={styleLabel}>Date Format</label>
                                <select style={styleSelect} value={form.date_format}
                                    onChange={e => update("date_format", e.target.value)}>
                                    {DATE_FORMATS.map(df => <option key={df.value} value={df.value}>{df.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div style={styleCard}>
                        <h3 style={styleSectionTitle}>Notification Preferences</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                                { key: "email_alerts", label: "Email alerts" },
                                { key: "browser_notifications", label: "Browser notifications" },
                                { key: "daily_summary", label: "Daily summary digest" },
                                { key: "sms_alerts", label: "SMS alerts" },
                            ].map(n => (
                                <label key={n.key} style={{
                                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                                    fontSize: 13, color: "var(--ink-700)",
                                }}>
                                    <input type="checkbox" checked={form.notification_preferences?.[n.key] || false}
                                        onChange={e => setForm(f => ({
                                            ...f,
                                            notification_preferences: {
                                                ...f.notification_preferences,
                                                [n.key]: e.target.checked,
                                            },
                                        }))} />
                                    {n.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            )}

            {/* Security */}
            {activeSection === "security" && (
                <div>
                    <div style={styleCard}>
                        <h3 style={styleSectionTitle}>Change Password</h3>
                        {pwMsg.text && (
                            <div style={{
                                padding: "8px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13,
                                background: pwMsg.type === "error" ? "var(--danger-tint, #fef2f2)" : "var(--success-tint, #f0fdf4)",
                                color: pwMsg.type === "error" ? "var(--danger, #dc2626)" : "var(--success, #16a34a)",
                                border: `1px solid ${pwMsg.type === "error" ? "var(--danger, #dc2626)" : "var(--success, #16a34a)"}20`,
                            }}>
                                {pwMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleChangePassword}>
                            <div className="field-group">
                                <label style={styleLabel}>Current Password</label>
                                <input style={styleInput} type="password" value={pwForm.current_password}
                                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
                            </div>
                            <div style={styleRow}>
                                <div style={styleField}>
                                    <label style={styleLabel}>New Password</label>
                                    <input style={styleInput} type="password" minLength={8} value={pwForm.new_password}
                                        onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required />
                                </div>
                                <div style={styleField}>
                                    <label style={styleLabel}>Confirm New Password</label>
                                    <input style={styleInput} type="password" value={pwForm.confirm}
                                        onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                                </div>
                            </div>
                            <button className="btn btn-primary" type="submit" disabled={changingPw}>
                                {changingPw ? "Changing…" : "Update Password"}
                            </button>
                        </form>
                    </div>

                    <div style={styleCard}>
                        <h3 style={styleSectionTitle}>Recent Account Activity</h3>
                        {auditLoading ? (
                            <div style={{ padding: 16, textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
                                Loading activity…
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <div style={{ padding: 16, textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
                                No recent activity recorded.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {auditLogs.slice(0, 15).map(log => (
                                    <div key={log._id} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "8px 0", fontSize: 13, color: "var(--ink-700)",
                                        borderBottom: "1px solid var(--border-hairline)",
                                    }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: "50%", flex: "none",
                                            background: log.action === "login" ? "var(--success, #16a34a)"
                                                : log.action === "logout" ? "var(--ink-400)"
                                                : "var(--accent)",
                                        }} />
                                        <span style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
                                                {log.action}
                                            </span>
                                            {log.entity_type !== "user" && (
                                                <span style={{ color: "var(--ink-400)" }}>
                                                    {" "}on {log.entity_type}
                                                </span>
                                            )}
                                        </span>
                                        <span style={{ color: "var(--ink-400)", fontSize: 12, whiteSpace: "nowrap" }}>
                                            {formatTimestamp(log.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}