import apiClient from "./client";

export const workflowsApi = {
    list: (params) => apiClient.get("/workflows", { params }),
    get: (id) => apiClient.get(`/workflows/${id}`),
    create: (payload) => apiClient.post("/workflows", payload),
    update: (id, payload) => apiClient.put(`/workflows/${id}`, payload),
    remove: (id) => apiClient.delete(`/workflows/${id}`),
    duplicate: (id) => apiClient.post(`/workflows/${id}/duplicate`),
    activate: (id) => apiClient.post(`/workflows/${id}/activate`),
    deactivate: (id) => apiClient.post(`/workflows/${id}/deactivate`),
    getStats: () => apiClient.get("/workflows/stats"),
    getEntities: (params) => apiClient.get("/workflows/entities", { params }),
};

export const workflowTemplatesApi = {
    list: (params) => apiClient.get("/workflow-templates", { params }),
    get: (id) => apiClient.get(`/workflow-templates/${id}`),
    create: (payload) => apiClient.post("/workflow-templates", payload),
    update: (id, payload) => apiClient.put(`/workflow-templates/${id}`, payload),
    remove: (id) => apiClient.delete(`/workflow-templates/${id}`),
    apply: (id) => apiClient.post(`/workflow-templates/${id}/apply`),
    seed: () => apiClient.get("/workflow-templates/seed"),
};

export const workflowExecutionsApi = {
    list: (params) => apiClient.get("/workflow-executions", { params }),
    get: (id) => apiClient.get(`/workflow-executions/${id}`),
    create: (payload) => apiClient.post("/workflow-executions", payload),
    start: (id) => apiClient.post(`/workflow-executions/${id}/start`),
    complete: (id, payload) => apiClient.post(`/workflow-executions/${id}/complete`, payload),
    fail: (id, payload) => apiClient.post(`/workflow-executions/${id}/fail`, payload),
    cancel: (id) => apiClient.post(`/workflow-executions/${id}/cancel`),
    addNodeLog: (id, payload) => apiClient.post(`/workflow-executions/${id}/node-log`, payload),
    getStats: (params) => apiClient.get("/workflow-executions/stats", { params }),
};

export const workflowAnalyticsApi = {
    getOverview: (params) => apiClient.get("/workflow-analytics/overview", { params }),
    getWorkflowPerformance: (id, params) => apiClient.get(`/workflow-analytics/workflow/${id}`, { params }),
};
