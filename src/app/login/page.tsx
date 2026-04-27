'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { login, verifyTotp } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [preAuthToken, setPreAuthToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await login(email, password);
            if (result.requiresTOTP && result.preAuthToken) {
                setPreAuthToken(result.preAuthToken);
                setStep('totp');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleTotp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyTotp(preAuthToken, totpCode);
            router.push('/');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Invalid TOTP code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-logo">ThickWire Admin</div>
                <p className="login-subtitle">
                    {step === 'credentials' ? 'Sign in to your account' : 'Enter your verification code'}
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                {step === 'credentials' ? (
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" placeholder="admin@thickwire.com" required
                                value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" placeholder="••••••••" required
                                value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleTotp}>
                        <div className="form-group">
                            <label className="form-label">6-digit TOTP Code</label>
                            <input className="form-input" type="text" placeholder="000000" required
                                maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value)}
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }} />
                        </div>
                        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                        <button type="button" className="btn btn-secondary btn-full" style={{ marginTop: 12 }}
                            onClick={() => { setStep('credentials'); setError(''); }}>
                            Back to Login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
