import { Link } from "react-router-dom";

export default function AccessDeniedPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
      <div className="card card-pad" style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Access denied</h1>
        <p className="text-muted" style={{ marginBottom: 18 }}>
          You do not have permission to view this section. Please contact an administrator if this seems incorrect.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
