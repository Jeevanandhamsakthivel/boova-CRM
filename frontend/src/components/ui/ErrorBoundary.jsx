import { Component } from "react";
import { Button } from "./Button";

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            const fallback = this.props.fallback;
            if (fallback) return typeof fallback === "function" ? fallback({ error: this.state.error, retry: this.handleRetry }) : fallback;

            return (
                <div className="page-loading" style={{ flexDirection: "column", gap: 12, padding: 40 }}>
                    <div style={{ fontSize: 32, opacity: 0.3 }}>⚠</div>
                    <h3 style={{ margin: 0, color: "var(--ink-800)" }}>Something went wrong</h3>
                    <p style={{ margin: 0, color: "var(--ink-500)", fontSize: 13, maxWidth: 400, textAlign: "center" }}>
                        {this.state.error?.message || "An unexpected error occurred. Please try again."}
                    </p>
                    <Button onClick={this.handleRetry} style={{ marginTop: 8 }}>Retry</Button>
                </div>
            );
        }

        return this.props.children;
    }
}
