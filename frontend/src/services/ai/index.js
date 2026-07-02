/**
 * AI Service — Modular provider architecture
 * 
 * Currently returns placeholder responses.
 * To connect to real AI:
 *   1. Set REACT_APP_AI_PROVIDER=openai|gemini|ollama in .env
 *   2. Configure provider-specific settings
 *   3. The orchestrator will route requests automatically
 * 
 * Supported providers: openai, gemini, ollama, groq
 * Set VITE_AI_PROVIDER=groq in .env to use Groq
 * Set VITE_GROQ_API_KEY in .env with your Groq API key
 * TODO: Integrate with LangChain for RAG and tool calling
 * TODO: Add streaming support via Server-Sent Events
 * TODO: Add context window management for long conversations
 */

const PROVIDERS = {
    openai: () => import('./providers/openai'),
    gemini: () => import('./providers/gemini'),
    ollama: () => import('./providers/ollama'),
    groq: () => import('./providers/groq'),
};

let activeProvider = null;

export function getProviderName() {
    try {
        return import.meta.env.VITE_AI_PROVIDER || 'openai';
    } catch {
        return 'openai';
    }
}

export async function getProvider() {
    const name = getProviderName();
    if (activeProvider) return activeProvider;
    const loader = PROVIDERS[name];
    if (!loader) {
        console.warn(`AI provider "${name}" not found, falling back to placeholder`);
        return { name: 'placeholder', ask: askPlaceholder, analyze: analyzePlaceholder, generate: generatePlaceholder };
    }
    try {
        const mod = await loader();
        activeProvider = mod.default || mod;
        return activeProvider;
    } catch (err) {
        console.error(`Failed to load AI provider "${name}":`, err);
        return { name: 'placeholder', ask: askPlaceholder, analyze: analyzePlaceholder, generate: generatePlaceholder };
    }
}

/* ─── Placeholder fallbacks ─── */

function askPlaceholder(context, prompt) {
    console.log(`[AI Placeholder] ask: context=${context}, prompt=${prompt}`);
    return Promise.resolve({
        success: true,
        message: 'AI response will be available once a provider is configured. Set VITE_AI_PROVIDER in your .env file.',
        suggestions: [
            'Set up your AI provider in Settings > AI Configuration',
            'Connect to OpenAI, Gemini, or Ollama',
            'Enable AI features for personalized insights',
        ],
    });
}

function analyzePlaceholder(dataType, data) {
    console.log(`[AI Placeholder] analyze: type=${dataType}`, data);
    const counts = Array.isArray(data) ? data.length : 0;
    return Promise.resolve({
        success: true,
        summary: `Analysis of ${dataType} complete. Found ${counts} items. Connect an AI provider for deeper insights.`,
        insights: [
            { label: 'Data Points', value: counts },
            { label: 'Status', value: 'Placeholder Mode' },
        ],
        recommendations: [
            'Configure an AI provider to unlock predictive analytics',
            'Enable automated trend detection',
            'Set up anomaly alerts',
        ],
    });
}

function generatePlaceholder(template, params) {
    console.log(`[AI Placeholder] generate: template=${template}`, params);
    return Promise.resolve({
        success: true,
        content: `# ${template}\n\nGenerated content will include AI-powered insights once a provider is configured.`,
        meta: { provider: 'placeholder', template, generatedAt: new Date().toISOString() },
    });
}

export default {
    getProvider,
    getProviderName,
    ask: async (context, prompt) => {
        const p = await getProvider();
        return p.ask(context, prompt);
    },
    analyze: async (dataType, data) => {
        const p = await getProvider();
        return p.analyze(dataType, data);
    },
    generate: async (template, params) => {
        const p = await getProvider();
        return p.generate(template, params);
    },
};
