'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Subscription {
    id: string;
    orderId: string;
    customerEmail: string;
    planId: string;
    serviceId: string;
    activatedAt: string;
    expiresAt: string;
    status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWED';
    reminder7d: boolean;
    reminder3d: boolean;
    reminder1d: boolean;
    order: {
        customerName: string;
        customerPhone: string | null;
        service: { name: string };
        plan: { name: string };
    };
}

const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: '#dcfce7', text: '#16a34a' },
    EXPIRING_SOON: { bg: '#fefce8', text: '#ca8a04' },
    EXPIRED: { bg: '#fef2f2', text: '#dc2626' },
    RENEWED: { bg: '#ede9fe', text: '#7c3aed' },
};

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/subscriptions', {
                params: { status: statusFilter || undefined, search: search || undefined, page, limit: 25 },
            });
            setSubscriptions(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error('Failed to load subscriptions', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalPages = Math.ceil(total / 25);

    const daysUntil = (date: string) => {
        const diff = new Date(date).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', background: '#ffffff', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Subscription Expiry Tracker</h1>
            </div>

            <div className="page-content" style={{ padding: '32px' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{
                            flex: 1, maxWidth: 300, padding: '10px 16px', borderRadius: '8px',
                            border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
                        }}
                    />
                    {['', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWED'].map((s) => (
                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                                cursor: 'pointer', letterSpacing: '0.5px',
                                border: statusFilter === s ? '2px solid #0f172a' : '1px solid #e2e8f0',
                                background: statusFilter === s ? '#0f172a' : 'white',
                                color: statusFilter === s ? 'white' : '#64748b',
                            }}
                        >{s || 'ALL'}</button>
                    ))}
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>{total} total</div>
                </div>

                {/* Table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>CUSTOMER</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>SERVICE / PLAN</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ACTIVATED</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>EXPIRES</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>DAYS LEFT</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>STATUS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>REMINDERS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                            ) : subscriptions.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No subscriptions found</td></tr>
                            ) : subscriptions.map((s) => {
                                const days = daysUntil(s.expiresAt);
                                const sc = statusColors[s.status] || { bg: '#f1f5f9', text: '#64748b' };
                                return (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.order.customerName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.customerEmail}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#334155' }}>{s.order.service.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.order.plan.name}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                            {new Date(s.activatedAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                            {new Date(s.expiresAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                fontWeight: 800, fontSize: '0.9rem',
                                                color: days <= 0 ? '#dc2626' : days <= 3 ? '#ca8a04' : '#16a34a',
                                            }}>{days <= 0 ? 'Expired' : `${days}d`}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                                                background: sc.bg, color: sc.text,
                                            }}>{s.status}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem' }}>
                                            <span style={{ color: s.reminder7d ? '#16a34a' : '#e2e8f0', marginRight: '4px' }}>7d{s.reminder7d ? '✓' : '○'}</span>
                                            <span style={{ color: s.reminder3d ? '#ca8a04' : '#e2e8f0', marginRight: '4px' }}>3d{s.reminder3d ? '✓' : '○'}</span>
                                            <span style={{ color: s.reminder1d ? '#dc2626' : '#e2e8f0' }}>1d{s.reminder1d ? '✓' : '○'}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                            style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Prev</button>
                        <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#64748b' }}>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                            style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Next</button>
                    </div>
                )}
            </div>
        </div>
    );
}
