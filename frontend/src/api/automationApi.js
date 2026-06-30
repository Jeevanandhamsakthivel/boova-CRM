import apiClient from "./client";

export const automationApi = {
    list: (params) => apiClient.get("/automation", { params }),
    get: (id) => apiClient.get(`/automation/${id}`),
    create: (payload) => apiClient.post("/automation", payload),
    update: (id, payload) => apiClient.put(`/automation/${id}`, payload),
    remove: (id) => apiClient.delete(`/automation/${id}`),
    evaluate: (payload) => apiClient.post("/automation/evaluate", payload),
};
