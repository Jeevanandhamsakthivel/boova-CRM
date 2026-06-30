/**
 * Ollama Provider — Local LLM
 * 
 * TODO: Configure endpoint via env: VITE_OLLAMA_URL (default: http://localhost:11434)
 * TODO: Configure model via env: VITE_OLLAMA_MODEL (default: llama3.2)
 * - Fully local, no data leaves your server
 * - Supports any model downloaded via Ollama
 * - Ideal for sensitive/offline environments
 */

const DEFAULT_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

function getBaseUrl() {
    try {
        return import.meta.env.VITE_OLLAMA_URL || DEFAULT_URL;
    } catch {
        return DEFAULT_URL;
    }
}

function getModel() {
    try {
        return import.meta.env.VITE_OLLAMA_MODEL || DEFAULT_MODEL;
    } catch {
        return DEFAULT_MODEL;
    }
}

export async function ask(context, prompt) {
    try {
        const response = await fetch(`${getBaseUrl()}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: getModel(),
                prompt: `Context: ${context}\n\nUser: ${prompt}\n\nAssistant:`,
                stream: false,
                options: { temperature: 0.7 },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            message: data.response || 'No response generated',
            meta: { model: data.model, duration: data.total_duration },
        };
    } catch (err) {
        console.error('Ollama API call failed:', err);
        return {
            success: false,
            message: err.message,
            suggestions: [
                'Ensure Ollama is running: ollama serve',
                'Set VITE_OLLAMA_URL if not using default http://localhost:11434',
                'Pull a model: ollama pull llama3.2',
            ],
        };
    }
}

export async function analyze(dataType, data) {
    return ask(`Data analysis for ${dataType}`, JSON.stringify(data, null, 2));
}

export async function generate(template, params) {
    return ask('Content generation', `Template: ${template}\nParams: ${JSON.stringify(params)}`);
}

export default { name: 'ollama', ask, analyze, generate };
