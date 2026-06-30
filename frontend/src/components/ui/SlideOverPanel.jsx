import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconX } from "./Icons";

export function SlideOverPanel({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open) return;
        function onKey(e) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="slideover-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="slideover-panel" role="dialog" aria-modal="true" aria-label={title}>
                <div className="slideover-header">
                    <h3>{title}</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
                        <IconX width={16} height={16} />
                    </button>
                </div>
                <div className="slideover-body">{children}</div>
            </div>
        </div>,
        document.body
    );
}
