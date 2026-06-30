import apiClient from "./client";

export const migrationApi = {
    preview: (payload) => apiClient.post("/migration/preview", payload),
    importFromCompetitor: (payload) => apiClient.post("/migration/import", payload),
    getEquivalency: (source) => apiClient.get(`/migration/equivalency/${source}`),
    listCompetitors: () => apiClient.get("/migration/competitors"),
};
