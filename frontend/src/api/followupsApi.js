import apiClient from "./client";

export const followupsApi = {
    list: (params) => apiClient.get("/followups", { params }),
    get: (id) => apiClient.get(`/followups/${id}`),
    create: (payload) => apiClient.post("/followups", payload),
    update: (id, payload) => apiClient.put(`/followups/${id}`, payload),
    remove: (id) => apiClient.delete(`/followups/${id}`),
};