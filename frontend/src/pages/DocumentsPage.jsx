import { IconStar } from "../components/ui/Icons";

export default function DocumentsPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-subtitle">Store, organize, and share documents</p>
                </div>
                <button className="btn btn-primary">+ Upload Document</button>
            </div>
            <div className="placeholder-module">
                <div className="placeholder-module-icon" style={{ background: "var(--gradient-warning)" }}>
                    <IconStar size={36} />
                </div>
                <h2>Document Management</h2>
                <p>Upload, organize, and share documents with your team and clients. Version control, permissions, and secure sharing. Coming soon.</p>
                <button className="btn btn-primary">Get Started</button>
            </div>
        </>
    );
}
