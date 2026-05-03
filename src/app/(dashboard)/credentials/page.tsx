'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Order, Paginated } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export default function CredentialsPage() {
    const [data, setData] = useState<Paginated<Order>>({ items: [], total: 0, page: 1, limit: 25 });
    const [loading, setLoading] = useState(true);
    const [serviceFilter, setServiceFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activationLink, setActivationLink] = useState('');
    const [sendingLink, setSendingLink] = useState(false);

    const { user } = useAuth();

    const loadData = () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page) });
        if (serviceFilter) params.append('service', serviceFilter);

        api.get(`/orders/admin/credentials?${params.toString()}`).then(({ data }) => {
            setData(data);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [page, serviceFilter]);

    // Simple polling
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && page === 1) {
                const params = new URLSearchParams({ page: '1' });
                if (serviceFilter) params.append('service', serviceFilter);
                api.get(`/orders/admin/credentials?${params.toString()}`).then(({ data: newData }) => {
                    if (newData.total !== data.total) {
                        setData(newData);
                    }
                });
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [loading, page, serviceFilter, data.total]);

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || !activationLink.trim()) return;

        try {
            setSendingLink(true);
            await api.post(`/orders/admin/${selectedOrder.id}/send-link`, { link: activationLink });
            setLinkModalOpen(false);
            setActivationLink('');
            loadData();
            alert('Activation link sent successfully and order marked as fulfilled.');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to send link');
        } finally {
            setSendingLink(false);
        }
    };

    const formatCredentials = (creds: Record<string, any> | undefined) => {
        if (!creds) return '-';
        return Object.entries(creds).map(([k, v]) => (
            <div key={k} style={{ fontSize: '0.8rem', color: '#475569' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{k}:</span> {String(v).includes('password') ? '••••••••' : String(v)}
            </div>
        ));
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', background: '#ffffff', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Service Credentials</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '16px' }}>Manage manual credential submissions and activation links.</p>
            </div>

            <div className="page-content" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                    <select
                        value={serviceFilter}
                        onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
                        style={{
                            width: 200, padding: '10px 16px', borderRadius: '8px',
                            border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', background: 'white'
                        }}
                    >
                        <option value="">All Services</option>
                        <option value="spotify">Spotify</option>
                        <option value="youtube">YouTube</option>
                        <option value="sonyliv">SonyLIV</option>
                        <option value="zee5">Zee5</option>
                    </select>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{data.total} orders total</div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ORDER ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>CUSTOMER</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>SERVICE & PLAN</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>CREDENTIALS DATA</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>STATUS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>DATE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ACTIONS</th>
                            </tr>
                        </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                                ) : data.items.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No credential orders found.</td></tr>
                                ) : data.items.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                                        <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#475569' }}>{order.id.slice(0, 8)}</span></td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.customerName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customerEmail}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customerPhone}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.service.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.plan.name}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {formatCredentials(order.serviceCredentials)}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700,
                                                background: order.fulfillmentStatus.includes('FULFILLED') ? '#dcfce7' : '#fef2f2',
                                                color: order.fulfillmentStatus.includes('FULFILLED') ? '#16a34a' : '#dc2626',
                                            }}>
                                                {order.fulfillmentStatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>{new Date(order.createdAt).toLocaleString()}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            {order.fulfillmentStatus === 'MANUAL_PENDING' && (
                                                <button
                                                    style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setLinkModalOpen(true);
                                                    }}
                                                >
                                                    Send Link
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

            {Math.ceil(data.total / data.limit) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Prev</button>
                    <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#64748b' }}>Page {page} of {Math.ceil(data.total / data.limit)}</span>
                    <button disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(page + 1)}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Next</button>
                </div>
            )}
            </div>

            {linkModalOpen && selectedOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Send Activation Link</h2>
                            <button onClick={() => { setLinkModalOpen(false); setSelectedOrder(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSendLink}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Customer</label>
                                <input type="text" value={`${selectedOrder.customerName} (${selectedOrder.customerEmail})`} disabled style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Service</label>
                                <input type="text" value={`${selectedOrder.service.name} - ${selectedOrder.plan.name}`} disabled style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Activation Link</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    required
                                    value={activationLink}
                                    onChange={e => setActivationLink(e.target.value)}
                                    style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
                                    This link will be sent to the customer via email and Telegram. The order will be automatically marked as fulfilled.
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => { setLinkModalOpen(false); setSelectedOrder(null); }} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                                <button type="submit" disabled={sendingLink} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                                    {sendingLink ? 'Sending...' : 'Send Link & Fulfill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
