import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="page-container" style={{ textAlign: "center", paddingTop: 100 }}>
      <h1 style={{ fontSize: 48 }}>404</h1>
      <p className="text-muted" style={{ marginBottom: 20 }}>This page doesn't exist, or you don't have access to it.</p>
      <Link to="/">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}