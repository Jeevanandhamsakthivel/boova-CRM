import { useEffect, useRef, useState } from "react";
import { notificationsApi } from "../../api/miscApi";
import { formatRelative } from "../../utils/formatters";
import { IconBell } from "../ui/Icons";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef(null);

  function load() {
    notificationsApi
      .list({ per_page: 8 })
      .then((res) => {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.meta?.unread_count || 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleOpen() {
    setOpen((prev) => !prev);
  }

  function handleMarkAllRead() {
    notificationsApi.markAllRead().then(load);
  }

  function handleItemClick(notification) {
    if (!notification.is_read) {
      notificationsApi.markRead(notification.id, true).then(load);
    }
  }

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <button className="topbar-icon-btn" onClick={handleOpen} aria-label="Notifications">
        <IconBell width={19} height={19} />
        {unreadCount > 0 && <span className="dot" />}
      </button>
      {open && (
        <div className="dropdown-menu" style={{ width: 340 }}>
          <div className="flex items-center justify-between" style={{ padding: "10px 14px" }}>
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: "none", border: "none", color: "var(--accent-strong)", fontSize: 12, cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="dropdown-divider" />
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {notifications.length === 0 && (
              <div className="dropdown-item text-muted">You're all caught up.</div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className="dropdown-item"
                style={{ alignItems: "flex-start", flexDirection: "column", gap: 3, background: n.is_read ? "transparent" : "var(--accent-tint)" }}
                onClick={() => handleItemClick(n)}
              >
                <span style={{ fontWeight: 600, fontSize: 12.5 }}>{n.title}</span>
                <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{n.message}</span>
                <span style={{ fontSize: 11, color: "var(--ink-200)" }}>{formatRelative(n.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}