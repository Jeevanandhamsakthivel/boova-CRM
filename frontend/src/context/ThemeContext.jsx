import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function getInitialTheme() {
    try {
        const stored = localStorage.getItem("psm-crm-theme");
        if (stored === "light" || stored === "dark") return stored;
    } catch {}
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem("psm-crm-theme", theme); } catch {}
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === "dark" ? "light" : "dark");
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
