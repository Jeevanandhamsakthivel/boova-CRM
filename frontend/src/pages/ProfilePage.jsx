import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [form, setForm] = useState({ name: "", email: "" });
    const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [msg, setMsg] = useState("");
    const [pwMsg, setPwMsg] = useState("");

    useEffect(() => {
        if (user) setForm({ name: user.name || user.full_name || "", email: user.email || "" });
    }, [user]);

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setMsg("");
        try {
            await authApi.updateMe(form);
            await refreshUser();
            setMsg("Profile updated.");
        } catch (err) {
            setMsg(err?.response?.data?.message || "Update failed.");
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        if (pwForm.new_password !== pwForm.confirm) { setPwMsg("Passwords don't match."); return; }
        setChangingPw(true);
        setPwMsg("");
        try {
            await authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
            setPwMsg("Password changed.");
            setPwForm({ current_password: "", new_password: "", confirm: "" });
        } catch (err) {
            setPwMsg(err?.response?.data?.message || "Failed to change password.");
        } finally {
            setChangingPw(false);
        }
    }

    const initials = user?.full_name?.split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";

    return (
        <div style={{ maxWidth: 560 }}>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>My Profile</h1>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
                <span className="avatar avatar-lg" style={{ background: "var(--accent)", color: "var(--ink-900)" }}>{initials}</span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.full_name || user?.email}</div>
                    <span className="badge badge-accent" style={{ marginTop: 4 }}>{user?.role}</span>
                </div>
            </div>

            {/* Profile Info */}
            <div className="card card-pad" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14 }}>Account Info</h3>
                {msg && <div className="badge badge-success" style={{ marginBottom: 12, borderRadius: 6 }}>{msg}</div>}
                <form onSubmit={handleSave}>
                    <div className="field-group">
                        <label className="field-label">Full Name</label>
                        <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Email</label>
                        <input className="field-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
                </form>
            </div>

            {/* Change Password */}
            <div className="card card-pad">
                <h3 style={{ margin: "0 0 16px", fontSize: 14 }}>Change Password</h3>
                {pwMsg && <div className={`badge ${pwMsg.includes("changed") ? "badge-success" : "badge-danger"}`} style={{ marginBottom: 12, borderRadius: 6 }}>{pwMsg}</div>}
                <form onSubmit={handleChangePassword}>
                    <div className="field-group">
                        <label className="field-label">Current Password</label>
                        <input className="field-input" type="password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
                    </div>
                    <div className="field-group">
                        <label className="field-label">New Password</label>
                        <input className="field-input" type="password" minLength={8} value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Confirm New Password</label>
                        <input className="field-input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                    </div>
                    <button className="btn btn-secondary" type="submit" disabled={changingPw}>{changingPw ? "Changing…" : "Change Password"}</button>
                </form>
            </div>
        </div>
    );
}
