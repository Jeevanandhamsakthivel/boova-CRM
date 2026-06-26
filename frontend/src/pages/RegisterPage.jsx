import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function set(field) {
        return (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form);
            navigate("/");
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
            <div className="card card-pad" style={{ width: "100%", maxWidth: 420 }}>
                <div style={{ marginBottom: 28, textAlign: "center" }}>
                    <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent)", color: "var(--ink-900)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>P</span>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 12, marginBottom: 4 }}>Create Account</h1>
                    <p className="text-muted text-sm">Join PSM CRM</p>
                </div>

                {error && <div className="badge badge-danger" style={{ marginBottom: 16, width: "100%", borderRadius: 6, justifyContent: "center" }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field-group">
                        <label className="field-label">Full Name</label>
                        <input className="field-input" required value={form.name} onChange={set("name")} placeholder="Jane Smith" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Email</label>
                        <input className="field-input" type="email" required value={form.email} onChange={set("email")} placeholder="you@company.com" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <input className="field-input" type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="Min. 8 characters" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Role</label>
                        <select className="field-select" value={form.role} onChange={set("role")}>
                            <option value="agent">Agent</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>
                <p className="text-muted text-sm" style={{ textAlign: "center", marginTop: 18 }}>
                    Already have an account? <Link to="/login" style={{ color: "var(--accent-strong)", fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
