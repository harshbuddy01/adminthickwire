import axios from 'axios';

let accessToken: string | null = null;

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // for refresh cookie
});

// Attach JWT to requests
api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const { data } = await api.post('/auth/refresh');
                accessToken = data.accessToken;
                original.headers.Authorization = `Bearer ${accessToken}`;
                return api(original);
            } catch {
                accessToken = null;
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    },
);

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

export default api;
