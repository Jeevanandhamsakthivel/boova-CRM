import apiClient from "./client";

export const calendarApi = {
    listMeetings: (params) => apiClient.get("/calendar/meetings", { params }),
    getMeeting: (id) => apiClient.get(`/calendar/meetings/${id}`),
    createMeeting: (payload) => apiClient.post("/calendar/meetings", payload),
    updateMeeting: (id, payload) => apiClient.put(`/calendar/meetings/${id}`, payload),
    deleteMeeting: (id) => apiClient.delete(`/calendar/meetings/${id}`),
};
