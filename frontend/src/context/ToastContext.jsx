import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);
let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (message, type = "info", duration = 4000) => {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, message, type }]);
            if (duration) {
                setTimeout(() => removeToast(id), duration);
            }
            return id;
        },
        [removeToast]
    );

    const toast = {
        success: (msg) => showToast(msg, "success"),
        error: (msg) => showToast(msg, "error"),
        info: (msg) => showToast(msg, "info"),
    };

    return (
        <ToastContext.Provider value={{ toast, toasts, removeToast }}>
            {children}
            <div className="toast-stack" role="status" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx.toast;
}