import apiClient from "./client";

export const exportApi = {
    all: (params) => apiClient.get("/export/all", { params }),
    csv: (collection) => apiClient.get(`/export/csv/${collection}`, { responseType: "blob" }),
};
