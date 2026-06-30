import { useState } from "react";
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
            { to: "/automation", label: "Automation", icon: IconActivity },
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

    return (
        <aside className={`app-rail${mobileOpen ? " mobile-open" : ""}`}>
            <div className="rail-brand" onClick={onCloseMobile}>
                <span className="rail-brand-mark">P</span>
                <span className="rail-brand-name">PSM CRM</span>
            </div>

            {NAV_SECTIONS.map((section) => {
                const visibleItems = section.items.filter(
                    (item) => !item.roles || item.roles.includes(user?.role)
                );
                if (visibleItems.length === 0) return null;
                return (
                    <div key={section.label}>
                        <div className="rail-section-label">{section.label}</div>
                        {visibleItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `rail-link${isActive ? " active" : ""}`}
                                onClick={onCloseMobile}
                            >
                                <item.icon width={18} height={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                );
            })}

            <div className="rail-footer">
                <button className="rail-collapse-toggle" onClick={onToggleCollapse}>
                    {collapsed ? <IconChevronRight width={15} height={15} /> : <IconChevronLeft width={15} height={15} />}
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}
