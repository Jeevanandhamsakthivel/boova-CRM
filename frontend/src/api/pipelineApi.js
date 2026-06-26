import apiClient from "./client";

export const pipelineApi = {
    listStages: () => apiClient.get("/pipeline/stages"),
    createStage: (payload) => apiClient.post("/pipeline/stages", payload),
    updateStage: (id, payload) => apiClient.put(`/pipeline/stages/${id}`, payload),
    removeStage: (id) => apiClient.delete(`/pipeline/stages/${id}`),
    board: () => apiClient.get("/pipeline/board"),
};

export const dealsApi = {
    list: (params) => apiClient.get("/deals", { params }),
    get: (id) => apiClient.get(`/deals/${id}`),
    create: (payload) => apiClient.post("/deals", payload),
    update: (id, payload) => apiClient.put(`/deals/${id}`, payload),
    remove: (id) => apiClient.delete(`/deals/${id}`),
    move: (id, stageId) => apiClient.post(`/deals/${id}/move`, { stage_id: stageId }),
};