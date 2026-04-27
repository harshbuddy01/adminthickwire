'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Service } from '@/lib/types';

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '', displayOrder: 0 });

    const load = () => {
        api.get('/services/admin/list').then(({ data }) => setServices(data)).finally(() => setLoading(false));
    };
    useEffect(load, []);

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

    return (
        <>
            <div className="top-header"><h1>Services</h1><button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Service</button></div>
            <div className="page-content">
                <div className="table-card">
                    <table>
                        <thead><tr><th>Name</th><th>Slug</th><th>Plans</th><th>Orders</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {services.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.name}</strong></td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.slug}</td>
                                    <td>{s._count?.plans || 0}</td>
                                    <td>{s._count?.orders || 0}</td>
                                    <td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-muted'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && <tr><td colSpan={6} className="table-empty">{loading ? 'Loading...' : 'No services'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </>
    );
}
