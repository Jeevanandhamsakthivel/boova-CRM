import apiClient from "./client";

export const knowledgeBaseApi = {
    list: (params) => apiClient.get("/knowledge-base", { params }),
    get: (id) => apiClient.get(`/knowledge-base/${id}`),
    create: (payload) => apiClient.post("/knowledge-base", payload),
    update: (id, payload) => apiClient.put(`/knowledge-base/${id}`, payload),
    remove: (id) => apiClient.delete(`/knowledge-base/${id}`),
};
