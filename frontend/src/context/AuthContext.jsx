import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/authApi";
import { setTokens, clearTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCurrentUser = useCallback(async () => {
        const token = localStorage.getItem("psm_access_token");
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await authApi.getMe();
            setUser(res.data.data);
        } catch {
            clearTokens();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCurrentUser();

        function handleExpired() {
            clearTokens();
            setUser(null);
        }
        window.addEventListener("psm:session-expired", handleExpired);
        return () => window.removeEventListener("psm:session-expired", handleExpired);
    }, [loadCurrentUser]);

    async function login(email, password) {
        const res = await authApi.login({ email, password });
        const { user: loggedInUser, access_token, refresh_token } = res.data.data;
        setTokens({ access_token, refresh_token });
        setUser(loggedInUser);
        return loggedInUser;
    }

    async function register(payload) {
        const res = await authApi.register(payload);
        const { user: newUser, access_token, refresh_token } = res.data.data;
        setTokens({ access_token, refresh_token });
        setUser(newUser);
        return newUser;
    }

    async function logout() {
        try {
            await authApi.logout();
        } catch {
            /* proceed with client-side logout regardless */
        }
        clearTokens();
        setUser(null);
    }

    function hasRole(...roles) {
        return !!user && roles.includes(user.role);
    }

    const value = {
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
        isAdmin: user?.role === "admin",
        isManager: user?.role === "manager",
        isAgent: user?.role === "agent",
        refreshUser: loadCurrentUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}