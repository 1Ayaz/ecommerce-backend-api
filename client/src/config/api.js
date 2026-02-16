import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// Request interceptor: attach token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('mubarak_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('mubarak_token');
            localStorage.removeItem('mubarak_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default API;
