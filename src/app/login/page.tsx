'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const { login, verifyTotp } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="login-wrapper premium-dark">
            <div className="branding-top-right">
                <ShieldCheck size={16} color="#10b981" />
                streamkart.store CRM
            </div>

            <div className="login-card premium-mode">
                <div className="card-highlight"></div>
                <div className="login-logo text-white">Admin Portal</div>
                <p className="login-subtitle" style={{ color: '#aaa' }}>
                    {step === 'credentials' ? 'Sign in to access the control panel' : 'Enter your 2FA verification code'}
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                {step === 'credentials' ? (
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label text-white">Email</label>
                            <input
                                className="form-input dark-input"
                                type="email"
                                placeholder="admin@thickwire.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label text-white">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="form-input dark-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', cursor: 'pointer', color: '#888', padding: '4px'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-full dark-btn" type="submit" disabled={loading} style={{ marginTop: '12px' }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleTotp}>
                        <div className="form-group">
                            <label className="form-label text-white" style={{ textAlign: 'center' }}>6-digit TOTP Code</label>
                            <input
                                className="form-input dark-input"
                                type="text"
                                placeholder="000 000"
                                required
                                maxLength={6}
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '8px', padding: '16px' }}
                            />
                        </div>
                        <button className="btn btn-primary btn-full dark-btn" type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-full"
                            style={{ background: 'transparent', color: '#888', border: 'none', marginTop: 12 }}
                            onClick={() => { setStep('credentials'); setError(''); }}
                        >
                            Back to Login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
