import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { FieldGroup, TextInput, FieldRow } from "../../components/ui/FormFields";
import { IconAlertTriangle } from "../../components/ui/Icons";
import { getErrorMessage, getFieldErrors } from "../../utils/errorUtils";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel-form">
        <div className="auth-form-card">
          <span className="rail-brand-mark">P</span>
          <h1>Create your account</h1>
          <p className="subtitle">New teammates join as Sales Agents by default.</p>

          {error && (
            <div className="alert-banner alert-error">
              <IconAlertTriangle width={16} height={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup label="Full name" required error={fieldErrors.name}>
              <TextInput
                required
                autoFocus
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup label="Email" required error={fieldErrors.email}>
              <TextInput
                type="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup label="Password" required hint="At least 8 characters." error={fieldErrors.password}>
              <TextInput
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </FieldGroup>
            <Button type="submit" className="btn-block" loading={submitting}>
              Create account
            </Button>
          </form>

          <div className="auth-form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>

      <div className="auth-panel-feature">
        <p className="auth-feature-quote">
          "Pipelines don't manage themselves. Give your team one shared view of every lead,
          customer, and deal in motion."
        </p>
        <div className="auth-feature-pipeline">
          <div className="auth-feature-stage filled" />
          <div className="auth-feature-stage filled" />
          <div className="auth-feature-stage" />
          <div className="auth-feature-stage" />
          <div className="auth-feature-stage" />
        </div>
      </div>
    </div>
  );
}