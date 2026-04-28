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

interface DeliveredCredential {
    id: string;
    customerName: string;
    customerEmail: string;
    deliveredAt: string;
    service: { name: string };
    plan: { name: string };
    subscriptionExpiry: {
        status: string;
        activatedAt: string;
        expiresAt: string;
    } | null;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: '#dcfce7', text: '#16a34a' },
    EXPIRING_SOON: { bg: '#fefce8', text: '#ca8a04' },
    EXPIRED: { bg: '#fef2f2', text: '#dc2626' },
    RENEWED: { bg: '#ede9fe', text: '#7c3aed' },
};

export default function SubscriptionsPage() {
    const [activeTab, setActiveTab] = useState<'expiry' | 'delivered'>('expiry');

    // Expiry Tracker State
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [totalSubs, setTotalSubs] = useState(0);
    const [subPage, setSubPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [subSearch, setSubSearch] = useState('');
    const [loadingSubs, setLoadingSubs] = useState(true);

    // Delivered Credentials State
    const [delivered, setDelivered] = useState<DeliveredCredential[]>([]);
    const [totalDelivered, setTotalDelivered] = useState(0);
    const [delPage, setDelPage] = useState(1);
    const [loadingDel, setLoadingDel] = useState(true);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [loadingModal, setLoadingModal] = useState(false);
    const [credentialRevealed, setCredentialRevealed] = useState(false);

    const fetchSubscriptions = useCallback(async () => {
        setLoadingSubs(true);
        try {
            const { data } = await api.get('/admin/subscriptions', {
                params: { status: statusFilter || undefined, search: subSearch || undefined, page: subPage, limit: 25 },
            });
            setSubscriptions(data.items);
            setTotalSubs(data.total);
        } catch (err) {
            console.error('Failed to load subscriptions', err);
        } finally {
            setLoadingSubs(false);
        }
    }, [statusFilter, subSearch, subPage]);

    const fetchDelivered = useCallback(async () => {
        setLoadingDel(true);
        try {
            const { data } = await api.get('/admin/subscriptions/delivered', {
                params: { page: delPage, limit: 25 },
            });
            setDelivered(data.items);
            setTotalDelivered(data.total);
        } catch (err) {
            console.error('Failed to load delivered credentials', err);
        } finally {
            setLoadingDel(false);
        }
    }, [delPage]);

    useEffect(() => {
        if (activeTab === 'expiry') {
            fetchSubscriptions();
        } else {
            fetchDelivered();
        }
    }, [fetchSubscriptions, fetchDelivered, activeTab]);

    const handleViewCredential = async (orderId: string) => {
        setModalOpen(true);
        setLoadingModal(true);
        setCredentialRevealed(false);
        setSelectedOrder(null);
        try {
            const { data } = await api.get(`/admin/orders/${orderId}/credential`);
            setSelectedOrder(data);
        } catch (err) {
            console.error('Failed to load credential detail', err);
            setSelectedOrder({ error: 'Failed to load credential information.' });
        } finally {
            setLoadingModal(false);
        }
    };

    const daysUntil = (date: string) => {
        const diff = new Date(date).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', background: '#ffffff', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Subscriptions</h1>
            </div>

            <div className="page-content" style={{ padding: '32px' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => setActiveTab('expiry')}
                        style={{
                            padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: activeTab === 'expiry' ? 800 : 600,
                            color: activeTab === 'expiry' ? '#8b5cf6' : '#64748b',
                            borderBottom: activeTab === 'expiry' ? '3px solid #8b5cf6' : '3px solid transparent',
                            transition: 'all 0.2s', marginBottom: '-1px'
                        }}
                    >
                        Expiry Tracker
                    </button>
                    <button
                        onClick={() => setActiveTab('delivered')}
                        style={{
                            padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: activeTab === 'delivered' ? 800 : 600,
                            color: activeTab === 'delivered' ? '#8b5cf6' : '#64748b',
                            borderBottom: activeTab === 'delivered' ? '3px solid #8b5cf6' : '3px solid transparent',
                            transition: 'all 0.2s', marginBottom: '-1px'
                        }}
                    >
                        Delivered Credentials
                    </button>
                </div>

                {/* Content: Expiry Tracker Tab */}
                {activeTab === 'expiry' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={subSearch}
                                onChange={(e) => { setSubSearch(e.target.value); setSubPage(1); }}
                                style={{
                                    flex: 1, maxWidth: 300, padding: '10px 16px', borderRadius: '8px',
                                    border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
                                }}
                            />
                            {['', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWED'].map((s) => (
                                <button key={s} onClick={() => { setStatusFilter(s); setSubPage(1); }}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                                        cursor: 'pointer', letterSpacing: '0.5px',
                                        border: statusFilter === s ? '2px solid #0f172a' : '1px solid #e2e8f0',
                                        background: statusFilter === s ? '#0f172a' : 'white',
                                        color: statusFilter === s ? 'white' : '#64748b',
                                    }}
                                >{s || 'ALL'}</button>
                            ))}
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>{totalSubs} total</div>
                        </div>

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
                                    {loadingSubs ? (
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

                        {Math.ceil(totalSubs / 25) > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                                <button disabled={subPage <= 1} onClick={() => setSubPage(subPage - 1)}
                                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Prev</button>
                                <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#64748b' }}>Page {subPage} of {Math.ceil(totalSubs / 25)}</span>
                                <button disabled={subPage >= Math.ceil(totalSubs / 25)} onClick={() => setSubPage(subPage + 1)}
                                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Next</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Content: Delivered Credentials Tab */}
                {activeTab === 'delivered' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>A log of all fulfilled orders and their delivered credentials.</p>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{totalDelivered} total</div>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ORDER #</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>CUSTOMER</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>SERVICE / PLAN</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>DELIVERED AT</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>EXPIRES</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>STATUS</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingDel ? (
                                        <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                                    ) : delivered.length === 0 ? (
                                        <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No delivered credentials found</td></tr>
                                    ) : delivered.map((d) => {
                                        const cStatus = d.subscriptionExpiry?.status || 'UNKNOWN';
                                        const sc = statusColors[cStatus] || { bg: '#f1f5f9', text: '#64748b' };
                                        return (
                                            <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>
                                                    {d.id.substring(0, 8)}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.customerName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.customerEmail}</div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: 600, color: '#334155' }}>{d.service?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.plan?.name}</div>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                                    {new Date(d.deliveredAt).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                                    {d.subscriptionExpiry?.expiresAt ? new Date(d.subscriptionExpiry.expiresAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                                                        background: sc.bg, color: sc.text,
                                                    }}>{cStatus}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleViewCredential(d.id)}
                                                        style={{
                                                            padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '6px',
                                                            border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {Math.ceil(totalDelivered / 25) > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                                <button disabled={delPage <= 1} onClick={() => setDelPage(delPage - 1)}
                                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Prev</button>
                                <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#64748b' }}>Page {delPage} of {Math.ceil(totalDelivered / 25)}</span>
                                <button disabled={delPage >= Math.ceil(totalDelivered / 25)} onClick={() => setDelPage(delPage + 1)}
                                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Credential Reveal Modal */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '500px', borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>View Credential</h2>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {loadingModal ? (
                                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>Loading credential details securely...</p>
                            ) : selectedOrder?.error ? (
                                <p style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>{selectedOrder.error}</p>
                            ) : selectedOrder ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>CUSTOMER</div>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.customerName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.customerEmail}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>PLAN</div>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.serviceName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.planName}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <div><span style={{ color: '#64748b' }}>Activated:</span> <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.activatedAt ? new Date(selectedOrder.activatedAt).toLocaleDateString() : 'N/A'}</span></div>
                                        <div><span style={{ color: '#64748b' }}>Expires:</span> <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.expiresAt ? new Date(selectedOrder.expiresAt).toLocaleDateString() : 'N/A'}</span></div>
                                    </div>

                                    <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />

                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginBottom: '12px' }}>CREDENTIAL INFORMATION</div>

                                        {!credentialRevealed ? (
                                            <div style={{ textAlign: 'center', padding: '32px', background: '#fffbeb', border: '1px dashed #fcd34d', borderRadius: '12px' }}>
                                                <p style={{ color: '#b45309', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 16px 0' }}>Credential is encrypted and hidden by default.</p>
                                                <button
                                                    onClick={() => setCredentialRevealed(true)}
                                                    style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                                                >
                                                    Reveal Credential
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {selectedOrder.credential.includes(':') ? (
                                                    // Display Email and Password separately if format is email:password
                                                    <>
                                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>EMAIL / USERNAME</div>
                                                                <div style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '1.05rem', fontFamily: 'monospace' }}>{selectedOrder.credential.split(':')[0]}</div>
                                                            </div>
                                                            <button onClick={() => navigator.clipboard.writeText(selectedOrder.credential.split(':')[0])} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Copy</button>
                                                        </div>
                                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>PASSWORD</div>
                                                                <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.05rem', fontFamily: 'monospace' }}>{selectedOrder.credential.substring(selectedOrder.credential.indexOf(':') + 1)}</div>
                                                            </div>
                                                            <button onClick={() => navigator.clipboard.writeText(selectedOrder.credential.substring(selectedOrder.credential.indexOf(':') + 1))} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Copy</button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // Display single block if unknown format
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>FULL CREDENTIAL</div>
                                                            <div style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '1.05rem', fontFamily: 'monospace' }}>{selectedOrder.credential}</div>
                                                        </div>
                                                        <button onClick={() => navigator.clipboard.writeText(selectedOrder.credential)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Copy</button>
                                                    </div>
                                                )}
                                                <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', fontSize: '0.8rem', color: '#065f46', marginTop: '4px' }}>
                                                    <strong>Note:</strong> Handle this information securely. This credential has been decrypted strictly for support access.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
