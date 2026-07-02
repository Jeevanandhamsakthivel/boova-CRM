const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function backendPost(endpoint, body) {
    try {
        const resp = await fetch(`${API_BASE}/ai/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await resp.json();
        if (!resp.ok) {
            return { success: false, message: json.message || `Server error: ${resp.status}` };
        }
        return json.data || json;
    } catch (err) {
        console.error('Backend AI proxy call failed:', err);
        return {
            success: false,
            message: err.message,
            suggestions: ['Check that the backend server is running', 'Verify network connectivity'],
        };
    }
}

export async function ask(context, prompt) {
    const result = await backendPost('ask', { context, prompt });
    if (result.success && !result.suggestions) {
        result.suggestions = [
            'Review your CRM data for more insights',
            'Schedule a pipeline review meeting',
        ];
    }
    return result;
}

export async function analyze(dataType, data) {
    const result = await backendPost('analyze', { data_type: dataType, data });
    return result;
}

export async function generate(template, params) {
    const result = await backendPost('generate', { template, params });
    return result;
}

export default { name: 'groq', ask, analyze, generate };
