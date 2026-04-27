'use client';

import { useState, useEffect } from 'react';
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

    useEffect(() => {
        api.get('/services/admin/list').then(({ data }) => { setServices(data); if (data[0]) { setSelectedServiceId(data[0].id); } }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedServiceId) return;
        api.get(`/services/admin/${selectedServiceId}/plans`).then(({ data }) => setPlans(data));
    }, [selectedServiceId]);

    const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', description: '', price: '', originalPrice: '', durationDays: 30, displayOrder: 0 }); setShowForm(true); };
    const openEdit = (p: Plan) => { setEditing(p); setForm({ name: p.name, slug: p.slug, description: p.description || '', price: p.price, originalPrice: p.originalPrice || '', durationDays: p.durationDays, displayOrder: p.displayOrder }); setShowForm(true); };

    const handleSave = async () => {
        const payload = { ...form, price: parseFloat(form.price), originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined };
        if (editing) { await api.put(`/services/admin/plans/${editing.id}`, payload); }
        else { await api.post(`/services/admin/${selectedServiceId}/plans`, payload); }
        setShowForm(false);
        api.get(`/services/admin/${selectedServiceId}/plans`).then(({ data }) => setPlans(data));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this plan?')) return;
        await api.delete(`/services/admin/plans/${id}`);
        api.get(`/services/admin/${selectedServiceId}/plans`).then(({ data }) => setPlans(data));
    };

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
                <div className="table-card">
                    <table>
                        <thead><tr><th>Name</th><th>Price</th><th>Original</th><th>Duration</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {plans.map(p => (
                                <tr key={p.id}>
                                    <td><strong>{p.name}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.slug}</div></td>
                                    <td>₹{parseFloat(p.price).toLocaleString()}</td>
                                    <td>{p.originalPrice ? `₹${parseFloat(p.originalPrice).toLocaleString()}` : '—'}</td>
                                    <td>{p.durationDays}d</td>
                                    <td><span className={`badge ${(p._count?.inventory || 0) > 5 ? 'badge-success' : (p._count?.inventory || 0) > 0 ? 'badge-warning' : 'badge-danger'}`}>{p._count?.inventory || 0}</span></td>
                                    <td><span className={`badge ${p.isActive ? 'badge-success' : 'badge-muted'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {plans.length === 0 && <tr><td colSpan={7} className="table-empty">{loading ? 'Loading...' : 'No plans for this service'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </>
    );
}
