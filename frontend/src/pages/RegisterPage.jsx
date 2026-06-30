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
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <span className="auth-brand-mark">P</span>
                    <span className="auth-brand-name">NovaCRM</span>
                </div>
                <div className="auth-title">
                    <h1>Create your account</h1>
                    <p>Join NovaCRM and streamline your workflow</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

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
                    <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
