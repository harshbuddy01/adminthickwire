import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // for refresh cookie
});

// Attach JWT to requests
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry && original.url !== '/auth/refresh') {
            original._retry = true;
            try {
                const { data } = await api.post('/auth/refresh');
                setAccessToken(data.accessToken);
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch {
                setAccessToken(null);
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    },
);

export function setAccessToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) {
        sessionStorage.setItem('adminAccessToken', token);
    } else {
        sessionStorage.removeItem('adminAccessToken');
    }
}

export function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('adminAccessToken');
}

export default api;
