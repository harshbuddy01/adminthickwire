'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Service, Plan } from '@/lib/types';

export default function PlansPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Plan | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', originalPrice: '', durationDays: 30, displayOrder: 0 });

    // Stock Drawer State
    const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
    const [stockPlan, setStockPlan] = useState<Plan | null>(null);
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [stockLoading, setStockLoading] = useState(false);
    const [stockTotal, setStockTotal] = useState(0);

    useEffect(() => {
        api.get('/services/admin/list').then(({ data }) => { setServices(data); if (data[0]) { setSelectedServiceId(data[0].id); } }).finally(() => setLoading(false));
    }, []);

    const loadPlans = useCallback(() => {
        if (!selectedServiceId) return;
        api.get(`/services/admin/${selectedServiceId}/plans`).then(({ data }) => setPlans(data));
    }, [selectedServiceId]);

    useEffect(() => { loadPlans(); }, [loadPlans]);

    const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', description: '', price: '', originalPrice: '', durationDays: 30, displayOrder: 0 }); setShowForm(true); };
    const openEdit = (p: Plan) => { setEditing(p); setForm({ name: p.name, slug: p.slug, description: p.description || '', price: p.price, originalPrice: p.originalPrice || '', durationDays: p.durationDays, displayOrder: p.displayOrder }); setShowForm(true); };

    const handleSave = async () => {
        const payload = { ...form, price: parseFloat(form.price), originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined };
        if (editing) { await api.put(`/services/admin/plans/${editing.id}`, payload); }
        else { await api.post(`/services/admin/${selectedServiceId}/plans`, payload); }
        setShowForm(false); loadPlans();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this plan?')) return;
        await api.delete(`/services/admin/plans/${id}`); loadPlans();
    };

    const openStockDrawer = async (plan: Plan) => {
        setStockPlan(plan);
        setStockDrawerOpen(true);
        setStockLoading(true);
        setStockItems([]);
        try {
            const { data } = await api.get(`/inventory/plan/${plan.id}?page=1&limit=100`);
            setStockItems(data.items);
            setStockTotal(data.total);
        } catch (err) {
            console.error('Failed to load stock', err);
        } finally {
            setStockLoading(false);
        }
    };

    const selectedService = services.find(s => s.id === selectedServiceId);

    return (
        <>
            <div className="top-header">
                <h1>Plans</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select className="form-select" style={{ width: 200 }} value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={!selectedServiceId}>+ Add Plan</button>
                </div>
            </div>
            <div className="page-content">
                {/* Quick Stats */}
                {plans.length > 0 && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: '3px solid #4F46E5' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plans</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{plans.length}</div>
                        </div>
                        <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: '3px solid #16A34A' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Stock</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{plans.reduce((sum, p) => sum + (p._count?.inventory || 0), 0)}</div>
                        </div>
                        <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: '3px solid #D97706' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Range</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>₹{Math.min(...plans.map(p => parseFloat(p.price)))} – ₹{Math.max(...plans.map(p => parseFloat(p.price)))}</div>
                        </div>
                    </div>
                )}

                <div className="table-card">
                    <table>
                        <thead><tr><th>Name</th><th>Price</th><th>Original</th><th>Duration</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {plans.map(p => {
                                const stockCount = p._count?.inventory || 0;
                                return (
                                    <tr key={p.id}>
                                        <td><strong>{p.name}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.slug}</div></td>
                                        <td style={{ fontWeight: 700 }}>₹{parseFloat(p.price).toLocaleString()}</td>
                                        <td style={{ color: '#94a3b8' }}>{p.originalPrice ? `₹${parseFloat(p.originalPrice).toLocaleString()}` : '—'}</td>
                                        <td>{p.durationDays}d</td>
                                        <td>
                                            <button
                                                onClick={() => openStockDrawer(p)}
                                                title="Click to view credentials"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                                    fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font)',
                                                    transition: 'all 0.15s',
                                                    background: stockCount > 5 ? '#DCFCE7' : stockCount > 0 ? '#FEF3C7' : '#FEE2E2',
                                                    color: stockCount > 5 ? '#16A34A' : stockCount > 0 ? '#D97706' : '#DC2626',
                                                }}
                                            >
                                                {stockCount}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                                            </button>
                                        </td>
                                        <td><span className={`badge ${p.isActive ? 'badge-success' : 'badge-muted'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                                        <td style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {plans.length === 0 && <tr><td colSpan={7} className="table-empty">{loading ? 'Loading...' : 'No plans for this service'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Plan Create/Edit Slide-Over */}
            {showForm && (
                <>
                    <div className="slide-over-backdrop" onClick={() => setShowForm(false)} />
                    <div className="slide-over">
                        <div className="slide-over-header"><h2>{editing ? 'Edit Plan' : 'Add Plan'}</h2><button className="slide-over-close" onClick={() => setShowForm(false)}>✕</button></div>
                        <div className="slide-over-body">
                            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Slug</label><input className="form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Price (₹)</label><input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Original Price (₹, optional)</label><input className="form-input" type="number" step="0.01" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Duration (days)</label><input className="form-input" type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: parseInt(e.target.value) || 30 })} /></div>
                            <div className="form-group"><label className="form-label">Display Order</label><input className="form-input" type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="slide-over-footer">
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </>
            )}

            {/* Stock Drawer — shows emails only */}
            {stockDrawerOpen && (
                <>
                    <div className="slide-over-backdrop" onClick={() => setStockDrawerOpen(false)} />
                    <div className="slide-over">
                        <div className="slide-over-header">
                            <div>
                                <h2 style={{ marginBottom: 2 }}>Stock: {stockPlan?.name}</h2>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedService?.name} • {stockTotal} credential{stockTotal !== 1 ? 's' : ''}</div>
                            </div>
                            <button className="slide-over-close" onClick={() => setStockDrawerOpen(false)}>✕</button>
                        </div>
                        <div className="slide-over-body" style={{ padding: 0 }}>
                            {/* Mini Stats */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ flex: 1, padding: '16px 24px', borderRight: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>{stockItems.filter(i => !i.isUsed).length}</div>
                                </div>
                                <div style={{ flex: 1, padding: '16px 24px' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Used</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706' }}>{stockItems.filter(i => i.isUsed).length}</div>
                                </div>
                            </div>

                            {stockLoading ? (
                                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading credentials...</p>
                                </div>
                            ) : stockItems.length === 0 ? (
                                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>📭</div>
                                    <p style={{ fontWeight: 600 }}>No credentials uploaded</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Go to Inventory → Single Add to upload</p>
                                </div>
                            ) : (
                                <div style={{ padding: 0 }}>
                                    {stockItems.map((item, idx) => {
                                        const emailPart = item.decryptedContent?.split(':')[0] || '—';
                                        return (
                                            <div key={item.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 24px', borderBottom: '1px solid #f1f5f9',
                                                transition: 'background 0.1s',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.7rem', fontWeight: 700,
                                                        background: item.isUsed ? '#FEF3C7' : '#DCFCE7',
                                                        color: item.isUsed ? '#92400E' : '#166534',
                                                        flexShrink: 0,
                                                    }}>
                                                        {idx + 1}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {emailPart}
                                                        </div>
                                                        {item.isUsed && item.order && (
                                                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                                                                → {item.order.customerName || item.order.customerEmail}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700,
                                                    background: item.isUsed ? '#FEF3C7' : '#DCFCE7',
                                                    color: item.isUsed ? '#92400E' : '#166534',
                                                }}>
                                                    {item.isUsed ? 'Sent' : 'Available'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
