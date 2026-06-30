import { useEffect, useState } from "react";
import { notificationsApi } from "../../api/miscApi";
import { IconBell, IconX, IconCheck } from "../ui/Icons";
import { formatRelative } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

export function NotificationsDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (open) loadNotifications();
    }, [open]);

    function loadNotifications() {
        setLoading(true);
        notificationsApi.list()
            .then((res) => {
                const items = res.data.data || [];
                setNotifications(items);
                setUnreadCount(items.filter((n) => !n.is_read).length);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }

    async function markRead(id) {
        try {
            await notificationsApi.markRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            toast.error("Failed to mark as read");
        }
    }

    async function markAllRead() {
        try {
            await notificationsApi.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch {
            toast.error("Failed to mark all as read");
        }
    }

    return (
        <div style={{ position: "relative" }}>
            <button
                className="topbar-icon-btn"
                onClick={() => setOpen((o) => !o)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
                <IconBell width={18} height={18} />
                {unreadCount > 0 && <span className="dot" />}
            </button>

            {open && (
                <>
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 70 }}
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="dropdown-menu"
                        style={{
                            right: 0,
                            width: 380,
                            maxHeight: 480,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            zIndex: 80,
                        }}
                    >
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderBottom: "1px solid var(--border)",
                            background: "var(--surface-sunken)",
                        }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-800)" }}>
                                Notifications
                                {unreadCount > 0 && (
                                    <span style={{
                                        marginLeft: 8,
                                        background: "var(--accent-red)",
                                        color: "#fff",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "1px 7px",
                                        borderRadius: 999,
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                            {unreadCount > 0 && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={markAllRead}
                                    style={{ fontSize: 12 }}
                                >
                                    <IconCheck width={12} height={12} />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1, overflowY: "auto" }}>
                            {loading && notifications.length === 0 && (
                                <div style={{ padding: 32, textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
                                    Loading...
                                </div>
                            )}
                            {!loading && notifications.length === 0 && (
                                <div style={{ padding: 40, textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
                                    No notifications yet.
                                </div>
                            )}
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    style={{
                                        padding: "12px 16px",
                                        borderBottom: "1px solid var(--border-light)",
                                        background: n.is_read ? "transparent" : "var(--accent-tint)",
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "flex-start",
                                        transition: "background var(--transition-fast)",
                                    }}
                                >
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: n.is_read ? "var(--ink-200)" : "var(--accent)",
                                        flexShrink: 0,
                                        marginTop: 5,
                                        transition: "background var(--transition-fast)",
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: 13,
                                            color: "var(--ink-800)",
                                            margin: "0 0 3px",
                                            fontWeight: n.is_read ? 400 : 600,
                                            lineHeight: 1.4,
                                        }}>
                                            {n.title || n.message || "Notification"}
                                        </p>
                                        <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>
                                            {formatRelative(n.created_at)}
                                        </span>
                                    </div>
                                    {!n.is_read && (
                                        <button
                                            className="btn-ghost"
                                            style={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: "var(--radius-sm)",
                                                border: "none",
                                                background: "transparent",
                                                color: "var(--ink-400)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                fontSize: 12,
                                                padding: 0,
                                            }}
                                            onClick={() => markRead(n.id)}
                                            title="Mark as read"
                                        >
                                            <IconX width={12} height={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
