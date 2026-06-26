import apiClient from "./client";

export const leadsApi = {
    list: (params) => apiClient.get("/leads", { params }),
    get: (id) => apiClient.get(`/leads/${id}`),
    create: (payload) => apiClient.post("/leads", payload),
    update: (id, payload) => apiClient.put(`/leads/${id}`, payload),
    remove: (id) => apiClient.delete(`/leads/${id}`),
    convert: (id, payload) => apiClient.post(`/leads/${id}/convert`, payload),
    activities: (id, params) => apiClient.get(`/leads/${id}/activities`, { params }),
};