import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    timeout: 15000, // 15 second timeout
});

// Request interceptor: attach token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('mubarak_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle auth failures, retries, and force re-login
const MAX_RETRIES = 1;
const RETRY_DELAY = 1500;

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response?.status;

        // Auth failure — force logout (only on explicit 401)
        if (status === 401) {
            console.error('[API] Force Logout Triggered by 401 from URL:', config.url);
            localStorage.removeItem('mubarak_token');
            localStorage.removeItem('mubarak_user');
            window.location.href = '/';
            return Promise.reject(error);
        }

        // Rate limit hit — don't retry, just reject
        if (status === 429) {
            console.warn('[API] Rate limited. Try again later.');
            return Promise.reject(error);
        }

        // Retry ONLY on 5xx (server alive but errored) — NOT on network errors (server down)
        const isRetryable = status >= 500 && ['get', 'head', 'options'].includes(config.method);
        config._retryCount = config._retryCount || 0;

        if (isRetryable && config._retryCount < MAX_RETRIES) {
            config._retryCount += 1;
            const delay = RETRY_DELAY * config._retryCount;
            await new Promise(resolve => setTimeout(resolve, delay));
            return API(config);
        }

        return Promise.reject(error);
    }
);

export default API;
