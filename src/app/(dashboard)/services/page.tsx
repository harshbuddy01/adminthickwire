'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Service, Plan } from '@/lib/types';

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '', displayOrder: 0 });

    // Plans Drawer State
    const [plansDrawerOpen, setPlansDrawerOpen] = useState(false);
    const [drawerService, setDrawerService] = useState<Service | null>(null);
    const [drawerPlans, setDrawerPlans] = useState<Plan[]>([]);
    const [drawerLoading, setDrawerLoading] = useState(false);

    const load = useCallback(() => {
        api.get('/services/admin/list').then(({ data }) => setServices(data)).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', description: '', displayOrder: 0 }); setShowForm(true); };
    const openEdit = (s: Service) => { setEditing(s); setForm({ name: s.name, slug: s.slug, description: s.description || '', displayOrder: s.displayOrder }); setShowForm(true); };

    const handleSave = async () => {
        if (editing) { await api.put(`/services/admin/${editing.id}`, form); }
        else { await api.post('/services/admin', form); }
        setShowForm(false); load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        await api.delete(`/services/admin/${id}`); load();
    };

    const openPlansDrawer = async (service: Service) => {
        setDrawerService(service);
        setPlansDrawerOpen(true);
        setDrawerLoading(true);
        setDrawerPlans([]);
        try {
            const { data } = await api.get(`/services/admin/${service.id}/plans`);
            setDrawerPlans(data);
        } catch (err) {
            console.error('Failed to load plans', err);
        } finally {
            setDrawerLoading(false);
        }
    };

    return (
        <>
            <div className="top-header">
                <h1>Services</h1>
                <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Service</button>
            </div>
            <div className="page-content">
                {/* Quick Stats */}
                {!loading && services.length > 0 && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: '3px solid #4F46E5' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Services</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{services.length}</div>
                        </div>
                        <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: '3px solid #16A34A' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Services</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{services.filter(s => s.isActive).length}</div>
                        </div>
                        <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: '3px solid #D97706' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Plans</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>{services.reduce((sum, s) => sum + (s._count?.plans || 0), 0)}</div>
                        </div>
                    </div>
                )}

                <div className="table-card">
                    <table>
                        <thead><tr><th>Name</th><th>Slug</th><th>Plans</th><th>Orders</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {services.map(s => {
                                const plansCount = s._count?.plans || 0;
                                return (
                                    <tr key={s.id}>
                                        <td><strong>{s.name}</strong></td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{s.slug}</td>
                                        <td>
                                            <button
                                                onClick={() => openPlansDrawer(s)}
                                                title="Click to view plans"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                                    fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font)',
                                                    transition: 'all 0.15s',
                                                    background: plansCount > 0 ? '#EEF2FF' : '#F1F5F9',
                                                    color: plansCount > 0 ? '#4F46E5' : '#64748B',
                                                }}
                                            >
                                                {plansCount} Plan{plansCount !== 1 ? 's' : ''}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                                            </button>
                                        </td>
                                        <td><span className="badge badge-muted">{s._count?.orders || 0}</span></td>
                                        <td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-muted'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                                        <td style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {services.length === 0 && <tr><td colSpan={6} className="table-empty">{loading ? 'Loading...' : 'No services created yet'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Service Create/Edit Slide-Over */}
            {showForm && (
                <>
                    <div className="slide-over-backdrop" onClick={() => setShowForm(false)} />
                    <div className="slide-over">
                        <div className="slide-over-header"><h2>{editing ? 'Edit Service' : 'Add Service'}</h2><button className="slide-over-close" onClick={() => setShowForm(false)}>✕</button></div>
                        <div className="slide-over-body">
                            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Slug</label><input className="form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Display Order</label><input className="form-input" type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="slide-over-footer">
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </>
            )}

            {/* Plans Drawer */}
            {plansDrawerOpen && (
                <>
                    <div className="slide-over-backdrop" onClick={() => setPlansDrawerOpen(false)} />
                    <div className="slide-over">
                        <div className="slide-over-header">
                            <div>
                                <h2 style={{ marginBottom: 2 }}>{drawerService?.name} Plans</h2>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{drawerPlans.length} plan{drawerPlans.length !== 1 ? 's' : ''} configured</div>
                            </div>
                            <button className="slide-over-close" onClick={() => setPlansDrawerOpen(false)}>✕</button>
                        </div>
                        <div className="slide-over-body" style={{ padding: 0 }}>
                            {drawerLoading ? (
                                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading plans...</p>
                                </div>
                            ) : drawerPlans.length === 0 ? (
                                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>📦</div>
                                    <p style={{ fontWeight: 600 }}>No plans for this service</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Go to the Plans tab to create one.</p>
                                </div>
                            ) : (
                                <div style={{ padding: 0 }}>
                                    {drawerPlans.map((plan) => {
                                        const stockCount = plan._count?.inventory || 0;
                                        return (
                                            <div key={plan.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
                                                transition: 'background 0.1s',
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: 4 }}>
                                                        {plan.name}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#64748b' }}>
                                                        <span><strong style={{ color: '#334155' }}>₹{parseFloat(plan.price).toLocaleString()}</strong></span>
                                                        <span>•</span>
                                                        <span>{plan.durationDays} days</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                                                        background: stockCount > 5 ? '#DCFCE7' : stockCount > 0 ? '#FEF3C7' : '#FEE2E2',
                                                        color: stockCount > 5 ? '#16A34A' : stockCount > 0 ? '#D97706' : '#DC2626',
                                                    }}>
                                                        {stockCount} in stock
                                                    </span>
                                                    <a href="/plans" style={{ fontSize: '0.7rem', color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
                                                        Manage →
                                                    </a>
                                                </div>
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
