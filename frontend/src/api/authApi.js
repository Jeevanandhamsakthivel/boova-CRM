import apiClient from "./client";

export const authApi = {
    register: (payload) => apiClient.post("/auth/register", payload),
    login: (payload) => apiClient.post("/auth/login", payload),
    logout: () => apiClient.post("/auth/logout"),
    getMe: () => apiClient.get("/auth/me"),
    updateMe: (payload) => apiClient.put("/auth/me", payload),
    changePassword: (payload) => apiClient.post("/auth/change-password", payload),
    uploadAvatar: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return apiClient.post("/auth/avatar", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    getMyAuditLogs: (params) => apiClient.get("/auth/me/audit", { params }),
};