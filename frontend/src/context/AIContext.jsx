/**
 * AI Context — Centralized state for all AI features
 *
 * Provides:
 *   - AI provider auto-initialization
 *   - Global AI request state (loading, errors)
 *   - AI insight cache
 *   - Provider-agnostic ask/analyze/generate methods
 *   - Provider selection/switching
 *
 * Auto-loads the AI provider on mount based on VITE_AI_PROVIDER env var.
 * Supported: openai, gemini, ollama, groq
 *
 * TODO: Add rate limiting for AI requests
 * TODO: Add request queuing for offline support
 * TODO: Add AI feature flag management
 * TODO: Add telemetry for AI usage tracking
 */

import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import aiService from '../services/ai';

const AIContext = createContext(null);

const initialState = {
    provider: null,
    providerName: null,
    ready: false,
    loading: false,
    error: null,
    insights: {},
    advisorHistory: [],
};

function aiReducer(state, action) {
    switch (action.type) {
        case 'SET_PROVIDER':
            return { ...state, provider: action.payload, providerName: action.payload?.name || null, ready: true, error: null };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'ADD_INSIGHT':
            return { ...state, insights: { ...state.insights, [action.payload.key]: action.payload.data } };
        case 'ADD_ADVISOR_MESSAGE':
            return { ...state, advisorHistory: [...state.advisorHistory, action.payload] };
        case 'CLEAR_ADVISOR':
            return { ...state, advisorHistory: [] };
        default:
            return state;
    }
}

export function AIProvider({ children }) {
    const [state, dispatch] = useReducer(aiReducer, initialState);

    useEffect(() => {
        aiService.getProvider().then(provider => {
            dispatch({ type: 'SET_PROVIDER', payload: provider });
        }).catch(err => {
            console.error('Failed to initialize AI provider:', err);
        });
    }, []);

    const setProvider = useCallback((provider) => {
        dispatch({ type: 'SET_PROVIDER', payload: provider });
    }, []);

    const setLoading = useCallback((loading) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
    }, []);

    const setError = useCallback((error) => {
        dispatch({ type: 'SET_ERROR', payload: error });
    }, []);

    const addInsight = useCallback((key, data) => {
        dispatch({ type: 'ADD_INSIGHT', payload: { key, data } });
    }, []);

    const addAdvisorMessage = useCallback((message) => {
        dispatch({ type: 'ADD_ADVISOR_MESSAGE', payload: message });
    }, []);

    const clearAdvisor = useCallback(() => {
        dispatch({ type: 'CLEAR_ADVISOR' });
    }, []);

    const askAI = useCallback(async (context, prompt) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const result = await aiService.ask(context, prompt);
            return result;
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message });
            return { success: false, message: err.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const analyzeAI = useCallback(async (dataType, data) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const result = await aiService.analyze(dataType, data);
            return result;
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message });
            return { success: false, message: err.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const generateAI = useCallback(async (template, params) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const result = await aiService.generate(template, params);
            return result;
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message });
            return { success: false, message: err.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const value = {
        ...state,
        setProvider,
        setLoading,
        setError,
        addInsight,
        addAdvisorMessage,
        clearAdvisor,
        askAI,
        analyzeAI,
        generateAI,
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const ctx = useContext(AIContext);
    if (!ctx) throw new Error('useAI must be used within AIProvider');
    return ctx;
}

export default AIContext;
