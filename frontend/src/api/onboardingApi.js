import apiClient from "./client";

export const onboardingApi = {
    listIndustries: () => apiClient.get("/onboarding/industries"),
    getStarterPack: (industry) => apiClient.get(`/onboarding/starter-pack/${industry}`),
};
