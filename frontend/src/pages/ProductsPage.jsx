import { IconStar } from "../components/ui/Icons";

export default function ProductsPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle">Manage your product catalog and inventory</p>
                </div>
                <button className="btn btn-primary">+ Add Product</button>
            </div>
            <div className="placeholder-module">
                <div className="placeholder-module-icon" style={{ background: "var(--gradient-purple)" }}>
                    <IconStar size={36} />
                </div>
                <h2>Product Catalog</h2>
                <p>Create and manage your product catalog with pricing, inventory tracking, and vendor management. Coming soon.</p>
                <button className="btn btn-primary">Get Started</button>
            </div>
        </>
    );
}
