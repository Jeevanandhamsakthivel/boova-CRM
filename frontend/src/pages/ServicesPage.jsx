import { IconStar } from "../components/ui/Icons";

export default function ServicesPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Services</h1>
                    <p className="page-subtitle">Define and manage your service offerings</p>
                </div>
                <button className="btn btn-primary">+ Add Service</button>
            </div>
            <div className="placeholder-module">
                <div className="placeholder-module-icon" style={{ background: "var(--gradient-info)" }}>
                    <IconStar size={36} />
                </div>
                <h2>Service Catalog</h2>
                <p>Create service packages, set pricing, manage service contracts, and track delivery. Coming soon.</p>
                <button className="btn btn-primary">Get Started</button>
            </div>
        </>
    );
}
