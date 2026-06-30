import apiClient from "./client";

export const workspaceApi = {
    get: (id) => apiClient.get(`/customers/${id}/workspace`),
    patch: (id, payload) => apiClient.patch(`/customers/${id}`, payload),
    listFiles: (id) => apiClient.get(`/customers/${id}/files`),
    uploadFile: (id, formData) =>
        apiClient.post(`/customers/${id}/files`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    deleteFile: (customerId, fileId) =>
        apiClient.delete(`/customers/${customerId}/files/${fileId}`),
    createNote: (entityType, entityId, description) =>
        apiClient.post("/activities/notes", { entity_type: entityType, entity_id: entityId, description }),
    updateNote: (activityId, description) =>
        apiClient.put(`/activities/${activityId}/note`, { description }),
};
