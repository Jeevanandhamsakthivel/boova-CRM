import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
});

function getAccessToken() {
    return localStorage.getItem("psm_access_token");
}

function getRefreshToken() {
    return localStorage.getItem("psm_refresh_token");
}

export function setTokens({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem("psm_access_token", access_token);
    if (refresh_token) localStorage.setItem("psm_refresh_token", refresh_token);
}

export function clearTokens() {
    localStorage.removeItem("psm_access_token");
    localStorage.removeItem("psm_refresh_token");
}

apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(newToken) {
    pendingQueue.forEach(({ resolve }) => resolve(newToken));
    pendingQueue = [];
}

function rejectQueue(error) {
    pendingQueue.forEach(({ reject }) => reject(error));
    pendingQueue = [];
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;
        if (!response || response.status !== 401 || config._retry) {
            return Promise.reject(error);
        }

        // Don't try to refresh on the auth endpoints themselves.
        if (config.url?.includes("/auth/login") || config.url?.includes("/auth/refresh")) {
            return Promise.reject(error);
        }

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearTokens();
            window.dispatchEvent(new CustomEvent("psm:session-expired"));
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject });
            }).then((newToken) => {
                config._retry = true;
                config.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(config);
            });
        }

        isRefreshing = true;
        try {
            const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, null, {
                headers: { Authorization: `Bearer ${refreshToken}` },
            });
            const newAccessToken = refreshResponse.data.data.access_token;
            setTokens({ access_token: newAccessToken });
            resolveQueue(newAccessToken);

            config._retry = true;
            config.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(config);
        } catch (refreshError) {
            rejectQueue(refreshError);
            clearTokens();
            window.dispatchEvent(new CustomEvent("psm:session-expired"));
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default apiClient;