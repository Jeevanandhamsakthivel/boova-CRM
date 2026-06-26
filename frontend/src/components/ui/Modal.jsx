import { useEffect } from "react";
import { IconX } from "./Icons";

export function Modal({ open, onClose, title, children, footer, maxWidth }) {
    useEffect(() => {
        if (!open) return;
        function handleKey(e) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-panel" style={maxWidth ? { maxWidth } : undefined}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
                        <IconX width={16} height={16} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}