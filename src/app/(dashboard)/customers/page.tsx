'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Customer {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    isActive: boolean;
    whatsappOptedIn: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    _count: { orders: number };
}

interface CustomerDetail extends Customer {
    orders: {
        id: string;
        amountPaid: string;
        paymentStatus: string;
        fulfillmentStatus: string;
        createdAt: string;
        service: { name: string };
        plan: { name: string };
    }[];
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
    const [slideoverOpen, setSlideoverOpen] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/customers', { params: { search: search || undefined, page, limit: 25 } });
            setCustomers(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error('Failed to load customers', err);
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const openDetail = async (id: string) => {
        try {
            const { data } = await api.get(`/admin/customers/${id}`);
            setSelectedCustomer(data);
            setSlideoverOpen(true);
        } catch (err) {
            console.error('Failed to load customer detail', err);
        }
    };

    const toggleActive = async (id: string, currentValue: boolean) => {
        try {
            await api.put(`/admin/customers/${id}/toggle-active`, { isActive: !currentValue });
            fetchCustomers();
            if (selectedCustomer?.id === id) {
                setSelectedCustomer({ ...selectedCustomer, isActive: !currentValue });
            }
        } catch (err) {
            console.error('Failed to toggle customer status', err);
        }
    };

    const totalPages = Math.ceil(total / 25);

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', background: '#ffffff', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Customer Accounts</h1>
            </div>

            <div className="page-content" style={{ padding: '32px' }}>
                {/* Search */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{
                            flex: 1, maxWidth: 400, padding: '10px 16px', borderRadius: '8px',
                            border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
                        }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{total} customers total</div>
                </div>

                {/* Table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>NAME</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>EMAIL</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>PHONE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ORDERS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>WHATSAPP</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>STATUS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>JOINED</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No customers found</td></tr>
                            ) : customers.map((c) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                    onClick={() => openDetail(c.id)}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                                >
                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{c.name || '—'}</td>
                                    <td style={{ padding: '12px 16px', color: '#334155' }}>{c.email}</td>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{c.phone || '—'}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>{c._count.orders}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700,
                                            background: c.whatsappOptedIn ? '#dcfce7' : '#fef2f2',
                                            color: c.whatsappOptedIn ? '#16a34a' : '#dc2626',
                                        }}>{c.whatsappOptedIn ? 'ON' : 'OFF'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700,
                                            background: c.isActive ? '#dcfce7' : '#fef2f2',
                                            color: c.isActive ? '#16a34a' : '#dc2626',
                                        }}>{c.isActive ? 'Active' : 'Disabled'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleActive(c.id, c.isActive); }}
                                            style={{
                                                padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                                                background: c.isActive ? '#fef2f2' : '#dcfce7',
                                                color: c.isActive ? '#dc2626' : '#16a34a',
                                                fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                                            }}
                                        >{c.isActive ? 'Disable' : 'Enable'}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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

            {/* Slide-over Detail Panel */}
            {slideoverOpen && selectedCustomer && (
                <div style={{
                    position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh',
                    background: 'white', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
                    zIndex: 100, overflowY: 'auto', animation: 'slideInRight 0.3s ease-out',
                }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Customer Detail</h2>
                        <button onClick={() => setSlideoverOpen(false)} style={{
                            border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px 12px',
                            cursor: 'pointer', fontWeight: 700, color: '#64748b',
                        }}>✕</button>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>NAME</div>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedCustomer.name || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>EMAIL</div>
                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{selectedCustomer.email}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>PHONE</div>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedCustomer.phone || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>STATUS</div>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700,
                                    background: selectedCustomer.isActive ? '#dcfce7' : '#fef2f2',
                                    color: selectedCustomer.isActive ? '#16a34a' : '#dc2626',
                                }}>{selectedCustomer.isActive ? 'Active' : 'Disabled'}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>WHATSAPP</div>
                                <div style={{ fontWeight: 600, color: selectedCustomer.whatsappOptedIn ? '#16a34a' : '#dc2626' }}>{selectedCustomer.whatsappOptedIn ? 'Opted In' : 'Not Opted'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>LAST LOGIN</div>
                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{selectedCustomer.lastLoginAt ? new Date(selectedCustomer.lastLoginAt).toLocaleString() : 'Never'}</div>
                            </div>
                        </div>

                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '12px' }}>Order History ({selectedCustomer.orders.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedCustomer.orders.length === 0 ? (
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No orders yet</div>
                            ) : selectedCustomer.orders.map((o) => (
                                <div key={o.id} style={{
                                    border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{o.service.name} — {o.plan.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{Number(o.amountPaid).toLocaleString()}</div>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 700,
                                            background: o.paymentStatus === 'CONFIRMED' ? '#dcfce7' : o.paymentStatus === 'FAILED' ? '#fef2f2' : '#fefce8',
                                            color: o.paymentStatus === 'CONFIRMED' ? '#16a34a' : o.paymentStatus === 'FAILED' ? '#dc2626' : '#ca8a04',
                                        }}>{o.paymentStatus}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
