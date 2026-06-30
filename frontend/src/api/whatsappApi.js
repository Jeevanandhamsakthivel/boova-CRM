import apiClient from "./client";

export const whatsappApi = {
    send: (payload) => apiClient.post("/whatsapp/send", payload),
    list: (params) => apiClient.get("/whatsapp/messages", { params }),
};
