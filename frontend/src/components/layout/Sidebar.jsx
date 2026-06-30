import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    IconDashboard,
    IconLeads,
    IconCustomers,
    IconFollowups,
    IconTasks,
    IconPipeline,
    IconReports,
    IconSettings,
    IconUsers,
    IconAudit,
    IconChevronLeft,
    IconChevronRight,
    IconBuilding,
    IconDollar,
    IconInbox,
    IconCalendar,
    IconTarget,
    IconActivity,
    IconWhatsApp,
    IconMail,
    IconGlobe,
    IconStar,
    IconTrendUp,
} from "../ui/Icons";

const NAV_SECTIONS = [
    {
        label: "Workspace",
        items: [
            { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
            { to: "/leads", label: "Leads", icon: IconLeads },
            { to: "/customers", label: "Customers", icon: IconCustomers },
            { to: "/companies", label: "Companies", icon: IconBuilding },
            { to: "/pipeline", label: "Pipeline", icon: IconPipeline },
        ],
    },
    {
        label: "Catalog",
        items: [
            { to: "/products", label: "Products", icon: IconStar },
            { to: "/services", label: "Services", icon: IconTarget },
        ],
    },
    {
        label: "Sales",
        items: [
            { to: "/quotes", label: "Quotes", icon: IconDollar },
            { to: "/invoices", label: "Invoices", icon: IconStar },
        ],
    },
    {
        label: "Activity",
        items: [
            { to: "/tasks", label: "Tasks", icon: IconTasks },
            { to: "/followups", label: "Follow-ups", icon: IconFollowups },
            { to: "/calendar", label: "Calendar", icon: IconCalendar },
            { to: "/projects", label: "Projects", icon: IconActivity },
        ],
    },
    {
        label: "Communications",
        items: [
            { to: "/email", label: "Email", icon: IconMail },
            { to: "/whatsapp", label: "WhatsApp", icon: IconWhatsApp },
        ],
    },
    {
        label: "Support",
        items: [
            { to: "/tickets", label: "Tickets", icon: IconInbox },
            { to: "/knowledge-base", label: "Knowledge Base", icon: IconGlobe },
        ],
    },
    {
        label: "Insights",
        items: [
            { to: "/reports", label: "Reports", icon: IconReports },
            { to: "/ai-assistant", label: "AI Assistant", icon: IconTrendUp },
            { to: "/automation", label: "Automation", icon: IconActivity },
            { to: "/documents", label: "Documents", icon: IconDollar },
        ],
    },
    {
        label: "Admin",
        items: [
            { to: "/users", label: "Users", icon: IconUsers, roles: ["admin"] },
            { to: "/audit-logs", label: "Audit Logs", icon: IconAudit, roles: ["admin"] },
            { to: "/settings", label: "Settings", icon: IconSettings, roles: ["admin"] },
            { to: "/data-export", label: "Data Export", icon: IconTarget, roles: ["admin"] },
        ],
    },
];

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
    const { user } = useAuth();

    const isActive = (item) => {
        const path = window.location.pathname;
        if (item.end) return path === item.to;
        return path.startsWith(item.to);
    };

    return (
        <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
            <div className="sidebar-brand" onClick={onCloseMobile}>
                <span className="sidebar-brand-icon">C</span>
                <span className="sidebar-brand-text">CRM Pro</span>
            </div>

            <nav className="sidebar-nav">
                {NAV_SECTIONS.map((section) => {
                    const visibleItems = section.items.filter(
                        (item) => !item.roles || item.roles.includes(user?.role)
                    );
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={section.label}>
                            <div className="sidebar-section-label">{section.label}</div>
                            {visibleItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive: active }) =>
                                        `sidebar-item${active ? " active" : ""}`
                                    }
                                    onClick={onCloseMobile}
                                >
                                    <item.icon width={19} height={19} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>

            <div style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
                <button className="sidebar-item" onClick={onToggleCollapse} style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
                    {collapsed ? <IconChevronRight width={19} height={19} /> : <IconChevronLeft width={19} height={19} />}
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}
