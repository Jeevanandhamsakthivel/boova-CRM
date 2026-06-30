import apiClient from "./client";

export const ticketsApi = {
    list: (params) => apiClient.get("/tickets", { params }),
    get: (id) => apiClient.get(`/tickets/${id}`),
    create: (payload) => apiClient.post("/tickets", payload),
    update: (id, payload) => apiClient.put(`/tickets/${id}`, payload),
    remove: (id) => apiClient.delete(`/tickets/${id}`),
    reply: (id, payload) => apiClient.post(`/tickets/${id}/reply`, payload),
};
