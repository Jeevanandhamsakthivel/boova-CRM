import apiClient from "./client";

export const setupWizardApi = {
    listTemplates: () => apiClient.get("/setup-wizard/templates"),
    getTemplateDetail: (businessType) => apiClient.get(`/setup-wizard/templates/${businessType}`),
    analyze: (description, basicInfo) => apiClient.post("/setup-wizard/analyze", { description, basic_info: basicInfo }),
    generate: (basicInfo, analysis, employees) => apiClient.post("/setup-wizard/generate", { basic_info: basicInfo, analysis, employees }),
    quickPreview: (data) => apiClient.post("/setup-wizard/quick-preview", data),
    save: (basicInfo, analysis, employees) => apiClient.post("/setup-wizard/save", { basic_info: basicInfo, analysis, employees }),

    validateEmployees: (employees, departments, roles) =>
        apiClient.post("/employee-setup/validate", { employees, departments, roles }),
    parseCsv: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post("/employee-setup/parse-csv", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    generateStructure: (employees, template, basicInfo) =>
        apiClient.post("/employee-setup/generate-structure", { employees, template, basic_info: basicInfo }),
};
