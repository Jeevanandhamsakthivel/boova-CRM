/**
 * Google Gemini Provider
 * 
 * TODO: Implement actual Gemini API calls
 * - Configure API key via env: VITE_GEMINI_API_KEY
 * - Configure model: VITE_GEMINI_MODEL (default: gemini-2.0-flash)
 * - Supports multimodal inputs (text + images)
 * - Supports streaming via Server-Sent Events
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.0-flash';

function getApiKey() {
    try {
        return import.meta.env.VITE_GEMINI_API_KEY || '';
    } catch {
        return '';
    }
}

function getModel() {
    try {
        return import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL;
    } catch {
        return DEFAULT_MODEL;
    }
}

export async function ask(context, prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            success: false,
            message: 'Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env',
            suggestions: [
                'Get a free API key from Google AI Studio',
                'Add VITE_GEMINI_API_KEY to your .env file',
                'AI features will work in placeholder mode until configured',
            ],
        };
    }

    try {
        const response = await fetch(
            `${API_BASE}/models/${getModel()}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: `Context: ${context}\n\nUser request: ${prompt}` },
                        ],
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
        return { success: true, message: text, usage: data?.usageMetadata };
    } catch (err) {
        console.error('Gemini API call failed:', err);
        return { success: false, message: err.message };
    }
}

export async function analyze(dataType, data) {
    return ask(`Data analysis for ${dataType}`, JSON.stringify(data, null, 2));
}

export async function generate(template, params) {
    return ask('Content generation', `Template: ${template}\nParams: ${JSON.stringify(params)}`);
}

export default { name: 'gemini', ask, analyze, generate };
