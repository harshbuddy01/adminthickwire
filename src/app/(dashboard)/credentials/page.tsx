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
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Service Credentials</h1>
                    <p className="page-subtitle">Manage manual credential submissions and activation links.</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <select
                        value={serviceFilter}
                        onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
                        className="input"
                        style={{ width: 200 }}
                    >
                        <option value="">All Services</option>
                        <option value="spotify">Spotify</option>
                        <option value="youtube">YouTube</option>
                        <option value="sonyliv">SonyLIV</option>
                        <option value="zee5">Zee5</option>
                    </select>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
                ) : data.items.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No credential orders found.</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Service & Plan</th>
                                    <th>Credentials Data</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map(order => (
                                    <tr key={order.id}>
                                        <td><span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{order.id.slice(0, 8)}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customerEmail}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customerPhone}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{order.service.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.plan.name}</div>
                                        </td>
                                        <td>
                                            {formatCredentials(order.serviceCredentials)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${order.fulfillmentStatus.includes('FULFILLED') ? 'success' : 'warning'}`}>
                                                {order.fulfillmentStatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                                        <td>
                                            {order.fulfillmentStatus === 'MANUAL_PENDING' && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
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
                )}
            </div>

            {/* Pagination */}
            {data.total > data.limit && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn btn-secondary"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-secondary"
                            disabled={page * data.limit >= data.total}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Send Link Modal */}
            {linkModalOpen && selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Send Activation Link</h2>
                            <button className="modal-close" onClick={() => { setLinkModalOpen(false); setSelectedOrder(null); }}>&times;</button>
                        </div>
                        <form onSubmit={handleSendLink}>
                            <div className="form-group">
                                <label className="form-label">Customer</label>
                                <input type="text" className="input" value={`${selectedOrder.customerName} (${selectedOrder.customerEmail})`} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Service</label>
                                <input type="text" className="input" value={`${selectedOrder.service.name} - ${selectedOrder.plan.name}`} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Activation Link</label>
                                <input
                                    type="url"
                                    className="input"
                                    placeholder="https://..."
                                    required
                                    value={activationLink}
                                    onChange={e => setActivationLink(e.target.value)}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 8 }}>
                                    This link will be sent to the customer via email and Telegram. The order will be automatically marked as fulfilled.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setLinkModalOpen(false); setSelectedOrder(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={sendingLink}>
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
