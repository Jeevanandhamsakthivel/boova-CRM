import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)", flexDirection: "column", gap: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 96, fontWeight: 700, color: "var(--border-hairline)", lineHeight: 1 }}>404</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: 0 }}>Page not found</h1>
            <p className="text-muted">The page you're looking for doesn't exist.</p>
            <Link to="/" className="btn btn-primary" style={{ textDecoration: "none" }}>Back to Dashboard</Link>
        </div>
    );
}
