import { useEffect, useState, useCallback } from "react";
import { Link, Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { CommandPalette } from "../common/CommandPalette";
import { useAuth } from "../../context/AuthContext";
import { searchApi } from "../../api/miscApi";
import { useDebounce } from "../../hooks/useDebounce";
import { useTheme } from "../../context/ThemeContext";
import FloatingActionButton from "../business/FloatingActionButton";

const BREADCRUMB_MAP = {
    "/": "Dashboard",
    "/leads": "Leads",
    "/customers": "Customers",
    "/companies": "Companies",
    "/pipeline": "Pipeline",
    "/quotes": "Quotes",
    "/invoices": "Invoices",
    "/tasks": "Tasks",
    "/followups": "Follow-ups",
    "/calendar": "Calendar",
    "/email": "Email",
    "/whatsapp": "WhatsApp",
    "/tickets": "Tickets",
    "/knowledge-base": "Knowledge Base",
    "/reports": "Reports",
    "/automation": "Automation",
    "/users": "Users",
    "/audit-logs": "Audit Logs",
    "/settings": "Settings",
    "/profile": "Profile",
    "/data-export": "Data Export",
    "/pricing": "Pricing",
    "/onboarding": "Onboarding",
    "/products": "Products",
    "/services": "Services",
    "/projects": "Projects",
    "/ai-assistant": "AI Assistant",
    "/documents": "Documents",
};

function Avatar({ name }) {
    const initials = name
        ? name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("")
        : "?";
    return (
        <span className="avatar avatar-accent avatar-ring" style={{ width: 32, height: 32, fontSize: 12 }}>
            {initials}
        </span>
    );
}

function Topbar({ onMobileMenu }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, accent, setAccentColor, accentColors } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const debouncedQuery = useDebounce(query, 250);

    const pathParts = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [];
    let acc = "";
    for (const part of pathParts) {
        acc += "/" + part;
        breadcrumbs.push({ path: acc, label: BREADCRUMB_MAP[acc] || part.charAt(0).toUpperCase() + part.slice(1) });
    }
    if (breadcrumbs.length === 0) breadcrumbs.push({ path: "/", label: "Dashboard" });

    useEffect(() => {
        function handleKeyDown(event) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setPaletteOpen((prev) => !prev);
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
                event.preventDefault();
                setShowSearch(true);
                setTimeout(() => document.getElementById("global-search-input")?.focus(), 50);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults(null);
            setSearching(false);
            return;
        }
        let ignore = false;
        setSearching(true);
        searchApi.search(debouncedQuery)
            .then((res) => {
                if (!ignore) setResults(res?.data?.data || null);
            })
            .catch(() => {
                if (!ignore) setResults({ leads: [], customers: [], tasks: [], deals: [] });
            })
            .finally(() => {
                if (!ignore) setSearching(false);
            });
        return () => { ignore = true; };
    }, [debouncedQuery]);

    function getResultPath(type, item) {
        const id = item?.id || item?._id;
        if (type === "leads") return `/leads/${id}`;
        if (type === "customers") return `/customers/${id}`;
        if (type === "tasks") return "/tasks";
        if (type === "deals") return "/pipeline";
        return "/";
    }

    function getResultTitle(type, item) {
        if (type === "leads") return item?.name || item?.title || "Lead";
        if (type === "customers") return item?.name || item?.company || "Customer";
        if (type === "tasks") return item?.title || "Task";
        if (type === "deals") return item?.title || "Deal";
        return "Record";
    }

    return (
        <>
            <header className="topbar">
                <div className="topbar-left">
                    <button className="sidebar-toggle" onClick={onMobileMenu} aria-label="Toggle navigation">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                    </button>
                    <div className="breadcrumbs">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={crumb.path} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {i > 0 && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={12} height={12} style={{ color: "var(--ink-400)" }}>
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                )}
                                {i === breadcrumbs.length - 1 ? (
                                    <span className="current">{crumb.label}</span>
                                ) : (
                                    <Link to={crumb.path}>{crumb.label}</Link>
                                )}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button className="quick-create-btn" onClick={() => navigate("/leads")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={14} height={14}>
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Quick Create
                    </button>

                    <button className="topbar-icon-btn" onClick={() => setShowSearch(!showSearch)} aria-label="Search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </button>

                    <button className="topbar-icon-btn" onClick={toggleTheme} aria-label="Toggle theme" title={theme === "dark" ? "Light mode" : "Dark mode"}>
                        {theme === "dark" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    <button className="topbar-icon-btn" onClick={() => setPaletteOpen(true)} aria-label="Command palette" title="Command palette (⌘K)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                        </svg>
                    </button>

                    <NotificationsDropdown />

                    <div style={{ position: "relative" }}>
                        <button className="topbar-user" onClick={() => setMenuOpen((o) => !o)}>
                            <Avatar name={user?.name || user?.full_name || user?.email} />
                            <span className="topbar-username">{user?.name || user?.full_name || user?.email?.split("@")[0]}</span>
                        </button>

                        {menuOpen && (
                            <>
                                <div style={{ position: "fixed", inset: 0, zIndex: 70 }} onClick={() => setMenuOpen(false)} />
                                <div className="dropdown-menu" style={{ zIndex: 80, right: 0, left: "auto" }}>
                                    <NavLink to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>My Profile</NavLink>
                                    <NavLink to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>Settings</NavLink>

                                    <div className="dropdown-divider" />
                                    <div style={{ padding: "8px 14px" }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-400)", marginBottom: 8 }}>Theme Accent</div>
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {accentColors.map((c) => (
                                                <button
                                                    key={c.name}
                                                    onClick={() => setAccentColor(c)}
                                                    style={{
                                                        width: 24, height: 24, borderRadius: "50%",
                                                        border: accent.h === c.h ? "2px solid #fff" : "2px solid transparent",
                                                        background: `hsl(${c.h}, ${c.s}%, ${c.l}%)`,
                                                        cursor: "pointer", transition: "all 0.15s",
                                                        outline: accent.h === c.h ? `2px solid hsl(${c.h}, ${c.s}%, ${c.l}%)` : "none",
                                                        outlineOffset: 2,
                                                    }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item dropdown-item-danger"
                                        onClick={() => { setMenuOpen(false); logout(); }}>
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {showSearch && (
                <div style={{
                    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)",
                    width: "90%", maxWidth: 560, zIndex: 200, overflow: "hidden",
                }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "relative" }}>
                        <svg style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: "var(--ink-500)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input id="global-search-input" value={query} onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search leads, customers, deals..."
                            style={{
                                width: "100%", border: "none", outline: "none", fontSize: 15,
                                paddingLeft: 28, background: "transparent", color: "var(--ink-800)",
                                fontFamily: "inherit",
                            }}
                        />
                    </div>
                    {query.trim() && (
                        <div style={{ maxHeight: 360, overflowY: "auto", padding: 8 }}>
                            {searching && <div className="dropdown-item" style={{ cursor: "default" }}>Searching...</div>}
                            {!searching && results && ["leads", "customers", "tasks", "deals"].some((type) => (results?.[type] || []).length > 0) && (
                                <>
                                    {(["leads", "customers", "tasks", "deals"].filter((type) => (results?.[type] || []).length > 0)).map((type) => (
                                        <div key={type}>
                                            <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-400)" }}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </div>
                                            {(results?.[type] || []).slice(0, 4).map((item) => (
                                                <Link key={`${type}-${item.id || item._id || Math.random()}`} to={getResultPath(type, item)}
                                                    className="dropdown-item"
                                                    onClick={() => { setQuery(""); setResults(null); setShowSearch(false); }}>
                                                    <span>{getResultTitle(type, item)}</span>
                                                    <small style={{ marginLeft: "auto", color: "var(--ink-400)" }}>{item?.status || item?.email || item?.company || ""}</small>
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </>
                            )}
                            {!searching && (!results || ["leads", "customers", "tasks", "deals"].every((type) => (results?.[type] || []).length === 0)) && (
                                <div className="dropdown-item" style={{ cursor: "default", color: "var(--ink-400)" }}>No matches found.</div>
                            )}
                        </div>
                    )}
                    <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--ink-400)", display: "flex", gap: 16 }}>
                        <span><kbd style={kbdStyle}>Esc</kbd> Close</span>
                    </div>
                </div>
            )}

            {showSearch && <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 199 }} onClick={() => setShowSearch(false)} />}

            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </>
    );
}

const kbdStyle = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "1px 5px", fontSize: 10, fontWeight: 700,
    background: "var(--ink-200)", borderRadius: 3,
    marginRight: 4, color: "var(--ink-600)",
};

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem("psm-crm-rail-collapsed") === "true"; } catch { return false; }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try { localStorage.setItem("psm-crm-rail-collapsed", collapsed); } catch {}
    }, [collapsed]);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 860 && mobileOpen) setMobileOpen(false);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [mobileOpen]);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    return (
        <div className={`app-shell${collapsed ? " sidebar-collapsed" : ""}`}>
            {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
            <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
            <div className="main-content">
                <Topbar onMobileMenu={() => setMobileOpen((o) => !o)} />
                <div className="page-container">
                    <Outlet />
                </div>
            </div>
            <FloatingActionButton />
        </div>
    );
}
