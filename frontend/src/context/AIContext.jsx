/**
 * AI Context — Centralized state for all AI features
 * 
 * Provides:
 *   - AI provider configuration
 *   - Global AI request state (loading, errors)
 *   - AI insight cache
 *   - Provider selection/switching
 * 
 * TODO: Add rate limiting for AI requests
 * TODO: Add request queuing for offline support
 * TODO: Add AI feature flag management
 * TODO: Add telemetry for AI usage tracking
 */

import { createContext, useCallback, useContext, useReducer, useState } from 'react';

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

    const value = {
        ...state,
        setProvider,
        setLoading,
        setError,
        addInsight,
        addAdvisorMessage,
        clearAdvisor,
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
