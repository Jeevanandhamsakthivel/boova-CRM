import { IconActivity } from "../components/ui/Icons";

export default function ProjectsPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">Plan, track, and deliver projects for your clients</p>
                </div>
                <button className="btn btn-primary">+ New Project</button>
            </div>
            <div className="placeholder-module">
                <div className="placeholder-module-icon" style={{ background: "var(--gradient-success)" }}>
                    <IconActivity size={36} />
                </div>
                <h2>Project Management</h2>
                <p>Manage client projects with task tracking, milestones, time tracking, and team collaboration. Coming soon.</p>
                <button className="btn btn-primary">Get Started</button>
            </div>
        </>
    );
}
