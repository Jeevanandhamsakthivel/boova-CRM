import apiClient from "./client";

export const emailApi = {
    send: (payload) => apiClient.post("/email/send", payload),
    list: (params) => apiClient.get("/email/sent", { params }),
    listTemplates: (params) => apiClient.get("/email/templates", { params }),
    createTemplate: (payload) => apiClient.post("/email/templates", payload),
    updateTemplate: (id, payload) => apiClient.put(`/email/templates/${id}`, payload),
    deleteTemplate: (id) => apiClient.delete(`/email/templates/${id}`),
    sendTest: (payload) => apiClient.post("/email/send-test", payload),
    getConfig: () => apiClient.get("/email/config"),
};
