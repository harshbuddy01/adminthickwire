'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, Mail, Lock } from 'lucide-react';

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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            {/* Left Branding Side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}></div>
                
                <div style={{ zIndex: 1, maxWidth: 480 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', width: 'fit-content', marginBottom: '24px', backdropFilter: 'blur(10px)' }}>
                        <ShieldCheck size={16} color="#4ade80" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>ADMIN SYSTEM</span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1.5px' }}>
                        StreamKart<br />
                        <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Control Center</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#9ca3af', lineHeight: 1.6 }}>
                        Securely access the administrative console to manage inventory, monitor orders, and oversee platform operations.
                    </p>
                </div>
            </div>

            {/* Right Form Side */}
            <div style={{ flex: '0 0 500px', background: '#ffffff', borderRadius: '40px 0 0 40px', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10, boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>
                <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-1px' }}>
                        {step === 'credentials' ? 'Welcome Admin' : 'Security Check'}
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '40px' }}>
                        {step === 'credentials' ? 'Authenticate to access the dashboard' : 'Enter your 6-digit authenticator code'}
                    </p>

                    {error && (
                        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#ef4444', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                            <div style={{ background: '#ef4444', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>!</div>
                            {error}
                        </div>
                    )}

                    {step === 'credentials' ? (
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        type="email"
                                        placeholder="admin@thickwire.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ width: '100%', padding: '16px 16px 16px 48px', background: '#f3f4f6', border: '2px solid transparent', borderRadius: '16px', fontSize: '1rem', color: '#111827', outline: 'none', transition: 'all 0.2s' }}
                                        onFocus={(e) => { e.target.style.background = '#fff'; e.target.style.borderColor = '#818cf8'; }}
                                        onBlur={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.borderColor = 'transparent'; }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: 32 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ width: '100%', padding: '16px 48px 16px 48px', background: '#f3f4f6', border: '2px solid transparent', borderRadius: '16px', fontSize: '1rem', color: '#111827', outline: 'none', transition: 'all 0.2s' }}
                                        onFocus={(e) => { e.target.style.background = '#fff'; e.target.style.borderColor = '#818cf8'; }}
                                        onBlur={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.borderColor = 'transparent'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading} 
                                style={{ width: '100%', background: '#111827', color: '#fff', padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Authenticating...' : 'Access Dashboard'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleTotp}>
                            <div style={{ marginBottom: 32 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>6-Digit Code</label>
                                <input
                                    type="text"
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    style={{ width: '100%', padding: '24px', background: '#f3f4f6', border: '2px solid transparent', borderRadius: '16px', fontSize: '2rem', letterSpacing: '12px', textAlign: 'center', color: '#111827', outline: 'none', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.background = '#fff'; e.target.style.borderColor = '#818cf8'; }}
                                    onBlur={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.borderColor = 'transparent'; }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading} 
                                style={{ width: '100%', background: '#4f46e5', color: '#fff', padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, marginBottom: 16 }}
                            >
                                {loading ? 'Verifying...' : 'Verify Identity'}
                            </button>
                            <button
                                type="button"
                                style={{ width: '100%', background: 'transparent', color: '#6b7280', padding: '12px', border: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => { setStep('credentials'); setError(''); }}
                            >
                                Back to Login
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
