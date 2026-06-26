import apiClient from "./client";

export const dashboardApi = {
    summary: () => apiClient.get("/dashboard/summary"),
};

export const reportsApi = {
    leadsByStatus: () => apiClient.get("/reports/leads-by-status"),
    leadsBySource: () => apiClient.get("/reports/leads-by-source"),
    dealsByStage: () => apiClient.get("/reports/deals-by-stage"),
    salesPerformance: (params) => apiClient.get("/reports/sales-performance", { params }),
    tasksCompletion: () => apiClient.get("/reports/tasks-completion"),
};

export const searchApi = {
    search: (q) => apiClient.get("/search", { params: { q } }),
};

export const notificationsApi = {
    list: (params) => apiClient.get("/notifications", { params }),
    markRead: (id, isRead = true) => apiClient.put(`/notifications/${id}/read`, { is_read: isRead }),
    markAllRead: () => apiClient.post("/notifications/mark-all-read"),
    remove: (id) => apiClient.delete(`/notifications/${id}`),
};

export const settingsApi = {
    list: (params) => apiClient.get("/settings", { params }),
    upsert: (payload) => apiClient.put("/settings", payload),
    remove: (key, params) => apiClient.delete(`/settings/${key}`, { params }),
};

export const usersApi = {
    list: (params) => apiClient.get("/users", { params }),
    get: (id) => apiClient.get(`/users/${id}`),
    update: (id, payload) => apiClient.put(`/users/${id}`, payload),
    remove: (id) => apiClient.delete(`/users/${id}`),
};

export const auditApi = {
    list: (params) => apiClient.get("/audit-logs", { params }),
};

export const activitiesApi = {
    listRecent: (params) => apiClient.get("/activities", { params }),
    listForEntity: (type, id, params) => apiClient.get(`/activities/${type}/${id}`, { params }),
};