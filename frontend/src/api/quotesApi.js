import apiClient from "./client";

export const quotesApi = {
    list: (params) => apiClient.get("/quotes", { params }),
    get: (id) => apiClient.get(`/quotes/${id}`),
    create: (payload) => apiClient.post("/quotes", payload),
    update: (id, payload) => apiClient.put(`/quotes/${id}`, payload),
    remove: (id) => apiClient.delete(`/quotes/${id}`),
};
