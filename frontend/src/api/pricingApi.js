import apiClient from "./client";

export const pricingApi = {
    listPlans: () => apiClient.get("/pricing/plans"),
    estimate: (payload) => apiClient.post("/pricing/estimate", payload),
    costComparison: (params) => apiClient.get("/pricing/cost-comparison", { params }),
};
