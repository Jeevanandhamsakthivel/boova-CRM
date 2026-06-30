import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ACCENT_COLORS = [
    { name: "Enterprise Purple", h: 262, s: 60, l: 47 },
    { name: "Zoho Blue", h: 221, s: 83, l: 53 },
    { name: "Aurora Teal", h: 180, s: 80, l: 45 },
    { name: "Sunset Orange", h: 25, s: 85, l: 55 },
    { name: "Rose Pink", h: 340, s: 75, l: 55 },
    { name: "Lime Green", h: 140, s: 65, l: 50 },
    { name: "Ocean Blue", h: 200, s: 90, l: 50 },
    { name: "Amber Gold", h: 45, s: 90, l: 55 },
];

const ThemeContext = createContext(null);

function getInitialTheme() {
    try {
        const stored = localStorage.getItem("psm-crm-theme");
        if (stored === "light" || stored === "dark") return stored;
    } catch {}
    return "light";
}

function getInitialAccent() {
    try {
        const stored = localStorage.getItem("psm-crm-accent");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.h && parsed.s && parsed.l) return parsed;
        }
    } catch {}
    return ACCENT_COLORS[0];
}

function applyAccent(accent) {
    const root = document.documentElement;
    root.style.setProperty("--accent-h", accent.h);
    root.style.setProperty("--accent-s", `${accent.s}%`);
    root.style.setProperty("--accent-l", `${accent.l}%`);
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);
    const [accent, setAccent] = useState(getInitialAccent);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem("psm-crm-theme", theme); } catch {}
    }, [theme]);

    useEffect(() => {
        applyAccent(accent);
        try { localStorage.setItem("psm-crm-accent", JSON.stringify(accent)); } catch {}
    }, [accent]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === "dark" ? "light" : "dark");
    }, []);

    const setAccentColor = useCallback((color) => {
        setAccent(color);
    }, []);

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            accent,
            setAccentColor,
            accentColors: ACCENT_COLORS,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
