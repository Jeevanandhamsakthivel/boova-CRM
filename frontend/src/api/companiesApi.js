import apiClient from "./client";

export const companiesApi = {
    list: (params) => apiClient.get("/companies", { params }),
    get: (id) => apiClient.get(`/companies/${id}`),
    create: (payload) => apiClient.post("/companies", payload),
    update: (id, payload) => apiClient.put(`/companies/${id}`, payload),
    remove: (id) => apiClient.delete(`/companies/${id}`),
};
