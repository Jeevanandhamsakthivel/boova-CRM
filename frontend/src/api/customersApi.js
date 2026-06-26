import apiClient from "./client";

export const customersApi = {
    list: (params) => apiClient.get("/customers", { params }),
    get: (id) => apiClient.get(`/customers/${id}`),
    create: (payload) => apiClient.post("/customers", payload),
    update: (id, payload) => apiClient.put(`/customers/${id}`, payload),
    remove: (id) => apiClient.delete(`/customers/${id}`),
    activities: (id, params) => apiClient.get(`/customers/${id}/activities`, { params }),
    deals: (id, params) => apiClient.get(`/customers/${id}/deals`, { params }),
};