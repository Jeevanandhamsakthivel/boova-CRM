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
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <span className="auth-brand-mark">P</span>
                    <span className="auth-brand-name">NovaCRM</span>
                </div>
                <div className="auth-title">
                    <h1>Welcome back</h1>
                    <p>Sign in to your account to continue</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field-group">
                        <label className="field-label">Email</label>
                        <input className="field-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <input className="field-input" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                    </div>
                    <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
                <p className="auth-footer">
                    No account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}
