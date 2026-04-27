'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
    const [testMsg, setTestMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState('');

    const sendTest = async () => {
        setSending(true); setResult('');
        try {
            await api.post('/admin/settings/test-telegram', { message: testMsg || 'Test notification from ThickWire Admin' });
            setResult('Telegram message sent successfully!');
        } catch (e: any) {
            setResult(e?.response?.data?.message || 'Failed to send');
        } finally { setSending(false); }
    };

    return (
        <>
            <div className="top-header"><h1>Settings</h1></div>
            <div className="page-content">
                {/* Telegram Test */}
                <div className="table-card" style={{ padding: 32 }}>
                    <h3 style={{ marginBottom: 8 }}>Telegram Bot</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
                        Send a test notification to verify your Telegram bot configuration.
                    </p>
                    <div className="form-group">
                        <label className="form-label">Test Message</label>
                        <input className="form-input" placeholder="Test notification from ThickWire Admin"
                            value={testMsg} onChange={e => setTestMsg(e.target.value)} />
                    </div>
                    {result && <div className={`alert ${result.includes('success') ? 'alert-success' : 'alert-error'}`}>{result}</div>}
                    <button className="btn btn-primary" onClick={sendTest} disabled={sending}>
                        {sending ? 'Sending...' : '📨 Send Test Message'}
                    </button>
                </div>

                {/* Environment Info */}
                <div className="table-card" style={{ padding: 32, marginTop: 24 }}>
                    <h3 style={{ marginBottom: 8 }}>Environment</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
                        Current API configuration.
                    </p>
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>API URL</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Frontend Version</span>
                            <span>1.0.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
