'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Admin } from '@/lib/types';

export default function UsersPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MANAGER' });
    const [error, setError] = useState('');

    const load = () => { api.get('/admin/users').then(({ data }) => setAdmins(data)); };
    useEffect(load, []);

    const handleCreate = async () => {
        setError('');
        try {
            await api.post('/admin/users', form);
            setShowForm(false); setForm({ name: '', email: '', password: '', role: 'MANAGER' }); load();
        } catch (e: any) { setError(e?.response?.data?.message || 'Failed'); }
    };

    const toggleActive = async (admin: Admin) => {
        await api.put(`/admin/users/${admin.id}`, { isActive: !admin.isActive }); load();
    };

    return (
        <>
            <div className="top-header"><h1>Admin Users</h1><button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Admin</button></div>
            <div className="page-content">
                <div className="table-card">
                    <table>
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>2FA</th><th>Status</th><th>Last Login</th><th>Action</th></tr></thead>
                        <tbody>
                            {admins.map(a => (
                                <tr key={a.id}>
                                    <td><strong>{a.name}</strong></td>
                                    <td>{a.email}</td>
                                    <td><span className={`badge ${a.role === 'SUPER_ADMIN' ? 'badge-accent' : 'badge-muted'}`}>{a.role}</span></td>
                                    <td><span className={`badge ${a.totpEnabled ? 'badge-success' : 'badge-warning'}`}>{a.totpEnabled ? 'Enabled' : 'Disabled'}</span></td>
                                    <td><span className={`badge ${a.isActive ? 'badge-success' : 'badge-danger'}`}>{a.isActive ? 'Active' : 'Disabled'}</span></td>
                                    <td style={{ fontSize: '0.8rem' }}>{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : 'Never'}</td>
                                    <td><button className="btn btn-secondary btn-sm" onClick={() => toggleActive(a)}>{a.isActive ? 'Disable' : 'Enable'}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <>
                    <div className="slide-over-backdrop" onClick={() => setShowForm(false)} />
                    <div className="slide-over">
                        <div className="slide-over-header"><h2>Add Admin</h2><button className="slide-over-close" onClick={() => setShowForm(false)}>✕</button></div>
                        <div className="slide-over-body">
                            {error && <div className="alert alert-error">{error}</div>}
                            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="MANAGER">Manager</option>
                                    <option value="SUPPORT">Support</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="slide-over-footer">
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate}>Create</button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
