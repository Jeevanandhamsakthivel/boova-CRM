/**
 * Extracts a human-readable message from the backend's standard error
 * envelope: { success: false, message, errors: [{ field, message }] }
 */
export function getErrorMessage(error) {
    const data = error?.response?.data;
    if (!data) return error?.message || "Something went wrong. Please try again.";

    if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join(" ");
    }
    return data.message || "Something went wrong. Please try again.";
}

export function getFieldErrors(error) {
    const errors = error?.response?.data?.errors;
    if (!Array.isArray(errors)) return {};
    const map = {};
    errors.forEach((e) => {
        if (e.field) map[e.field] = e.message;
    });
    return map;
}