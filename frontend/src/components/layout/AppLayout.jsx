import { useEffect, useState } from "react";
import { Link, Outlet, NavLink, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { CommandPalette } from "../common/CommandPalette";
import { useAuth } from "../../context/AuthContext";
import { searchApi } from "../../api/miscApi";
import { useDebounce } from "../../hooks/useDebounce";
import { useTheme } from "../../context/ThemeContext";
import { IconSearch } from "../ui/Icons";

function Avatar({ name }) {
    const initials = name
        ? name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("")
        : "?";
    return (
        <span
            style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--gradient-gold)",
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

function Topbar({ onMobileMenu }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const debouncedQuery = useDebounce(query, 250);

    // Global Cmd+K / Ctrl+K handler
    useEffect(() => {
        function handleKeyDown(event) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setPaletteOpen((prev) => !prev);
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
            <header className="app-topbar">
                <div className="topbar-left">
                    <button
                        className="topbar-icon-btn mobile-menu"
                        onClick={onMobileMenu}
                        aria-label="Toggle navigation menu"
                        title="Menu"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                    </button>
                    <div className="topbar-search">
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search anything..."
                            aria-label="Global search"
                        />
                        <span className="search-kbd">
                            <kbd>⌘</kbd><kbd>K</kbd>
                        </span>

                        {query.trim() && (
                            <div className="topbar-search-results">
                                {searching && <div className="search-result-item">Searching...</div>}
                                {!searching && results && ["leads", "customers", "tasks", "deals"].some((type) => (results?.[type] || []).length > 0) && (
                                    <>
                                        {(["leads", "customers", "tasks", "deals"].filter((type) => (results?.[type] || []).length > 0)).map((type) => (
                                            <div key={type} className="search-group">
                                                <div className="search-group-title">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                                                {(results?.[type] || []).slice(0, 4).map((item) => (
                                                    <Link
                                                        key={`${type}-${item.id || item._id || Math.random()}`}
                                                        to={getResultPath(type, item)}
                                                        className="search-result-item"
                                                        onClick={() => { setQuery(""); setResults(null); }}
                                                    >
                                                        <span>{getResultTitle(type, item)}</span>
                                                        <small>{item?.status || item?.email || item?.company || ""}</small>
                                                    </Link>
                                                ))}
                                            </div>
                                        ))}
                                    </>
                                )}
                                {!searching && (!results || ["leads", "customers", "tasks", "deals"].every((type) => (results?.[type] || []).length === 0)) && (
                                    <div className="search-result-item">
                                        <span style={{ color: "var(--ink-400)" }}>No matches found.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="topbar-actions">
                    <button
                        className="topbar-icon-btn"
                        onClick={toggleTheme}
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        title={theme === "dark" ? "Light mode" : "Dark mode"}
                    >
                        {theme === "dark" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                                <circle cx="12" cy="12" r="5" />
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    <button
                        className="topbar-icon-btn"
                        onClick={() => setPaletteOpen(true)}
                        aria-label="Command palette"
                        title="Command palette (⌘K)"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                        </svg>
                    </button>

                    <div className="topbar-separator" />

                    <NotificationsDropdown />

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
                                <div
                                    style={{ position: "fixed", inset: 0, zIndex: 70 }}
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="dropdown-menu" style={{ zIndex: 80 }}>
                                    <NavLink
                                        to="/profile"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        My Profile
                                    </NavLink>
                                    <NavLink
                                        to="/settings"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Settings
                                    </NavLink>
                                    <div className="dropdown-divider" />
                                    <button
                                        className="dropdown-item dropdown-item-danger"
                                        style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
                                        onClick={() => { setMenuOpen(false); logout(); }}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </>
    );
}

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 640 && mobileOpen) {
                setMobileOpen(false);
            }
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [mobileOpen]);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    return (
        <div className={`app-shell${collapsed ? " rail-collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
            <div
                className={`rail-backdrop${mobileOpen ? " visible" : ""}`}
                onClick={() => setMobileOpen(false)}
            />
            <Sidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((c) => !c)}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />
            <div className="app-main">
                <Topbar onMobileMenu={() => setMobileOpen((o) => !o)} />
                <div className="page-container">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
