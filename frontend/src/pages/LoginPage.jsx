import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate("/");
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid credentials.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
            <div className="card card-pad" style={{ width: "100%", maxWidth: 400 }}>
                <div style={{ marginBottom: 28, textAlign: "center" }}>
                    <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent)", color: "var(--ink-900)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>P</span>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 12, marginBottom: 4 }}>PSM CRM</h1>
                    <p className="text-muted text-sm">Sign in to your account</p>
                </div>

                {error && <div className="badge badge-danger" style={{ marginBottom: 16, width: "100%", borderRadius: 6, justifyContent: "center" }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field-group">
                        <label className="field-label">Email</label>
                        <input className="field-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <input className="field-input" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
                <p className="text-muted text-sm" style={{ textAlign: "center", marginTop: 18 }}>
                    No account? <Link to="/register" style={{ color: "var(--accent-strong)", fontWeight: 600 }}>Register</Link>
                </p>
            </div>
        </div>
    );
}
