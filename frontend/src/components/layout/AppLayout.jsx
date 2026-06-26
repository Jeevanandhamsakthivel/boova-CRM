import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

function Avatar({ name }) {
    const initials = name
        ? name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join("")
        : "?";
    return (
        <span
            style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "var(--ink-900)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
            }}
        >
            {initials}
        </span>
    );
}

function Topbar() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="app-topbar">
            {/* left — breadcrumb placeholder */}
            <div style={{ flex: 1 }} />

            {/* right actions */}
            <div className="topbar-actions">
                <div style={{ position: "relative" }}>
                    <div
                        className="topbar-user"
                        onClick={() => setMenuOpen((o) => !o)}
                    >
                        <Avatar name={user?.name || user?.full_name || user?.email} />
                        <div className="topbar-user-meta">
                            <span className="topbar-user-name">
                                {user?.name || user?.full_name || user?.email}
                            </span>
                            <span className="topbar-user-role">
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    {menuOpen && (
                        <>
                            {/* backdrop */}
                            <div
                                style={{
                                    position: "fixed",
                                    inset: 0,
                                    zIndex: 70,
                                }}
                                onClick={() => setMenuOpen(false)}
                            />
                            <div
                                className="dropdown-menu"
                                style={{ zIndex: 80 }}
                            >
                                <NavLink
                                    to="/profile"
                                    className="dropdown-item"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Profile
                                </NavLink>
                                <div className="dropdown-divider" />
                                <button
                                    className="dropdown-item"
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                        color: "var(--danger)",
                                        textAlign: "left",
                                    }}
                                    onClick={() => {
                                        setMenuOpen(false);
                                        logout();
                                    }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`app-shell${collapsed ? " rail-collapsed" : ""}`}>
            <Sidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((c) => !c)}
            />
            <div className="app-main">
                <Topbar />
                <div className="page-container">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
