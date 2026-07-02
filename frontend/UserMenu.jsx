import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";
import { IconChevronDown, IconLogout, IconSettings } from "../ui/Icons";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <div className="topbar-user" onClick={() => setOpen((p) => !p)}>
        <Avatar name={user.name} />
        <div className="topbar-user-meta">
          <span className="topbar-user-name">{user.name}</span>
          <span className="topbar-user-role">{user.role}</span>
        </div>
        <IconChevronDown width={15} height={15} />
      </div>
      {open && (
        <div className="dropdown-menu">
          <div className="dropdown-item" onClick={() => { setOpen(false); navigate("/profile"); }}>
            <IconSettings width={15} height={15} /> My profile
          </div>
          <div className="dropdown-divider" />
          <div className="dropdown-item" onClick={handleLogout}>
            <IconLogout width={15} height={15} /> Sign out
          </div>
        </div>
      )}
    </div>
  );
}