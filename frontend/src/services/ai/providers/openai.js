/**
 * OpenAI Provider
 * 
 * TODO: Implement actual OpenAI API calls
 * - Configure API key via env: VITE_OPENAI_API_KEY
 * - Configure model: VITE_OPENAI_MODEL (default: gpt-4o-mini)
 * - Supports streaming via Server-Sent Events
 * - Supports function calling for structured outputs
 */

const API_BASE = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

function getApiKey() {
    try {
        return import.meta.env.VITE_OPENAI_API_KEY || '';
    } catch {
        return '';
    }
}

function getModel() {
    try {
        return import.meta.env.VITE_OPENAI_MODEL || DEFAULT_MODEL;
    } catch {
        return DEFAULT_MODEL;
    }
}

export async function ask(context, prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return placeholderResponse('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env');
    }

    try {
        const response = await fetch(`${API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: getModel(),
                messages: [
                    { role: 'system', content: `You are a Business OS AI assistant. Context: ${context}` },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            message: data.choices?.[0]?.message?.content || 'No response generated',
            usage: data.usage,
        };
    } catch (err) {
        console.error('OpenAI API call failed:', err);
        return placeholderResponse(err.message);
    }
}

export async function analyze(dataType, data) {
    const prompt = `Analyze the following ${dataType} data and provide insights:\n${JSON.stringify(data, null, 2)}`;
    return ask(`Data analysis for ${dataType}`, prompt);
}

export async function generate(template, params) {
    const prompt = `Generate content using the "${template}" template with these parameters:\n${JSON.stringify(params, null, 2)}`;
    return ask('Content generation', prompt);
}

function placeholderResponse(message) {
    return {
        success: false,
        message,
        suggestions: [
            'Add VITE_OPENAI_API_KEY to your .env file',
            'Or switch to a different AI provider',
            'AI features will work in placeholder mode until configured',
        ],
    };
}

export default { name: 'openai', ask, analyze, generate };
