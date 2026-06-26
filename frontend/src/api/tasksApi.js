import apiClient from "./client";

export const tasksApi = {
    list: (params) => apiClient.get("/tasks", { params }),
    get: (id) => apiClient.get(`/tasks/${id}`),
    create: (payload) => apiClient.post("/tasks", payload),
    update: (id, payload) => apiClient.put(`/tasks/${id}`, payload),
    remove: (id) => apiClient.delete(`/tasks/${id}`),
};