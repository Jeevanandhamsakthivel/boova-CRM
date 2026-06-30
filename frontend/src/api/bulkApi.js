import apiClient from "./client";

export const bulkApi = {
    action: (payload) => apiClient.post("/bulk", payload),
};
