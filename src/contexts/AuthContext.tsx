'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api, { setAccessToken, getAccessToken } from '@/lib/api';

interface AuthUser {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ requiresTOTP: boolean; preAuthToken?: string }>;
    verifyTotp: (preAuthToken: string, code: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Try refresh on mount to recover session from httpOnly cookie
    const tryRefresh = useCallback(async () => {
        try {
            const { data } = await api.post('/auth/refresh');
            if (data.accessToken) {
                setAccessToken(data.accessToken);
                const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                setUser({ id: payload.sub, email: payload.email, role: payload.role });
            }
        } catch {
            // No valid session — user must login
            setUser(null);
            setAccessToken(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        tryRefresh();
    }, [tryRefresh]);

    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.requiresTOTP) {
            return { requiresTOTP: true, preAuthToken: data.preAuthToken };
        }
        setAccessToken(data.accessToken);
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, role: payload.role });
        return { requiresTOTP: false };
    };

    const verifyTotp = async (preAuthToken: string, code: string) => {
        const { data } = await api.post('/auth/verify-totp', { preAuthToken, code });
        setAccessToken(data.accessToken);
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, role: payload.role });
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch { /* ignore */ }
        setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, verifyTotp, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
