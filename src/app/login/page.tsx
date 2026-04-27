'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';

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
        <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-black flex items-center justify-center p-4 relative">

            {/* Top Right Branding */}
            <div className="absolute top-6 right-8 text-gray-500 text-sm font-semibold tracking-widest uppercase flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                streamkart.store CRM
            </div>

            <div className="w-full max-w-md bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative highlight */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Admin Portal</h1>
                    <p className="text-gray-400 text-sm">
                        {step === 'credentials' ? 'Sign in to access the control panel' : 'Enter your 2FA verification code'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                )}

                {step === 'credentials' ? (
                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Admin Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                                    type="email"
                                    placeholder="admin@thickwire.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="w-full bg-white text-black font-semibold rounded-xl py-3 hover:bg-gray-200 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Secure Sign In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleTotp} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 text-center mb-3">6-digit Authenticator Code</label>
                            <input
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-xl py-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-center tracking-[0.5em] text-2xl font-mono"
                                type="text"
                                placeholder="000 000"
                                required
                                maxLength={6}
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            />
                        </div>
                        <button
                            className="w-full bg-white text-black font-semibold rounded-xl py-3 hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Access'}
                        </button>
                        <button
                            type="button"
                            className="w-full bg-transparent text-gray-400 font-medium rounded-xl py-3 hover:text-white transition-all"
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
