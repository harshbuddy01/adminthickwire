'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Order, Paginated } from '@/lib/types';

export default function OrdersPage() {
    const [data, setData] = useState<Paginated<Order>>({ items: [], total: 0, page: 1, limit: 25 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ paymentStatus: '', fulfillmentStatus: '', search: '', page: 1 });
    const [fulfillId, setFulfillId] = useState('');
    const [fulfillContent, setFulfillContent] = useState('');

    const load = () => {
        const params = new URLSearchParams();
        if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
        if (filters.fulfillmentStatus) params.set('fulfillmentStatus', filters.fulfillmentStatus);
        if (filters.search) params.set('search', filters.search);
        params.set('page', String(filters.page));
        api.get(`/orders/admin/list?${params}`).then(({ data }) => setData(data)).finally(() => setLoading(false));
    };

    useEffect(load, [filters]);

    const handleFulfill = async () => {
        if (!fulfillId || !fulfillContent) return;
        await api.post(`/orders/admin/${fulfillId}/fulfill`, { content: fulfillContent });
        setFulfillId(''); setFulfillContent(''); load();
    };

    return (
        <>
            <div className="top-header"><h1>Orders</h1></div>
            <div className="page-content">
                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <input className="form-input" style={{ width: 240 }} placeholder="Search by name, email, ID..."
                        value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} />
                    <select className="form-select" style={{ width: 160 }} value={filters.paymentStatus} onChange={e => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })}>
                        <option value="">All Payments</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="FAILED">Failed</option>
                    </select>
                    <select className="form-select" style={{ width: 180 }} value={filters.fulfillmentStatus} onChange={e => setFilters({ ...filters, fulfillmentStatus: e.target.value, page: 1 })}>
                        <option value="">All Fulfillment</option>
                        <option value="PENDING">Pending</option>
                        <option value="FULFILLED">Fulfilled</option>
                        <option value="MANUAL_PENDING">Manual Pending</option>
                        <option value="MANUAL_FULFILLED">Manual Fulfilled</option>
                    </select>
                </div>

                <div className="table-card">
                    <table>
                        <thead><tr><th>ID</th><th>Customer</th><th>Service / Plan</th><th>Amount</th><th>Payment</th><th>Fulfillment</th><th>Date</th><th>Action</th></tr></thead>
                        <tbody>
                            {data.items.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.id.slice(0, 8)}</td>
                                    <td><div>{o.customerName}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.customerEmail}</div></td>
                                    <td>{o.service?.name} — {o.plan?.name}</td>
                                    <td>₹{Number(o.amountPaid).toLocaleString()}</td>
                                    <td><span className={`badge ${o.paymentStatus === 'CONFIRMED' ? 'badge-success' : o.paymentStatus === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>{o.paymentStatus}</span></td>
                                    <td><span className={`badge ${o.fulfillmentStatus.includes('FULFILLED') ? 'badge-success' : o.fulfillmentStatus === 'MANUAL_PENDING' ? 'badge-accent' : 'badge-muted'}`}>{o.fulfillmentStatus}</span></td>
                                    <td style={{ fontSize: '0.8rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                                    <td>{o.fulfillmentStatus === 'MANUAL_PENDING' && <button className="btn btn-primary btn-sm" onClick={() => setFulfillId(o.id)}>Fulfill</button>}</td>
                                </tr>
                            ))}
                            {data.items.length === 0 && <tr><td colSpan={8} className="table-empty">{loading ? 'Loading...' : 'No orders'}</td></tr>}
                        </tbody>
                    </table>
                    <div className="pagination">
                        <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>← Prev</button>
                        <span>Page {data.page} of {Math.ceil(data.total / data.limit) || 1}</span>
                        <button disabled={filters.page >= Math.ceil(data.total / data.limit)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next →</button>
                    </div>
                </div>

                {/* Manual Fulfill Dialog */}
                {fulfillId && (
                    <>
                        <div className="slide-over-backdrop" onClick={() => setFulfillId('')} />
                        <div className="slide-over">
                            <div className="slide-over-header"><h2>Manual Fulfill</h2><button className="slide-over-close" onClick={() => setFulfillId('')}>✕</button></div>
                            <div className="slide-over-body">
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Enter the credential/content to deliver for order <strong>{fulfillId.slice(0, 8)}</strong></p>
                                <div className="form-group">
                                    <label className="form-label">Content to deliver</label>
                                    <textarea className="form-input" placeholder="Credential, key, or link..." value={fulfillContent} onChange={e => setFulfillContent(e.target.value)} />
                                </div>
                            </div>
                            <div className="slide-over-footer">
                                <button className="btn btn-secondary" onClick={() => setFulfillId('')}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleFulfill}>Deliver & Notify</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
