'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discountType: 'PERCENT' | 'FLAT';
    discountValue: number;
    maxUses: number | null;
    usedCount: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    applicableServiceIds: string[];
    applicablePlanIds: string[];
    isActive: boolean;
    startsAt: string;
    expiresAt: string | null;
    createdAt: string;
}

const initialForm = {
    code: '', description: '', discountType: 'PERCENT' as 'PERCENT' | 'FLAT',
    discountValue: 0, maxUses: '', minOrderAmount: '', maxDiscountAmount: '',
    expiresAt: '',
};

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(initialForm);
    const [showBulk, setShowBulk] = useState(false);
    const [bulkForm, setBulkForm] = useState({ count: 10, prefix: 'TW', discountType: 'PERCENT' as 'PERCENT' | 'FLAT', discountValue: 10, maxUses: 1, expiresAt: '' });
    const [usageData, setUsageData] = useState<{ couponId: string; data: any[] } | null>(null);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/coupons');
            setCoupons(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const handleSubmit = async () => {
        try {
            const payload = {
                code: form.code,
                description: form.description || undefined,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                maxUses: form.maxUses ? Number(form.maxUses) : undefined,
                minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
                maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
                expiresAt: form.expiresAt || undefined,
            };
            if (editingId) {
                await api.patch(`/api/v1/admin/coupons/${editingId}`, payload);
            } else {
                await api.post('/admin/coupons', payload);
            }
            setShowForm(false);
            setEditingId(null);
            setForm(initialForm);
            fetchCoupons();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save coupon');
        }
    };

    const startEdit = (c: Coupon) => {
        setForm({
            code: c.code,
            description: c.description || '',
            discountType: c.discountType,
            discountValue: c.discountValue,
            maxUses: c.maxUses?.toString() || '',
            minOrderAmount: c.minOrderAmount?.toString() || '',
            maxDiscountAmount: c.maxDiscountAmount?.toString() || '',
            expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
        });
        setEditingId(c.id);
        setShowForm(true);
    };

    const deactivate = async (id: string) => {
        if (!confirm('Deactivate this coupon?')) return;
        await api.delete(`/api/v1/admin/coupons/${id}`);
        fetchCoupons();
    };

    const viewUsage = async (id: string) => {
        try {
            const { data } = await api.get(`/api/v1/admin/coupons/${id}/usage`);
            setUsageData({ couponId: id, data });
        } catch (err) { console.error(err); }
    };

    const handleBulkGenerate = async () => {
        try {
            const { data } = await api.post('/api/v1/admin/coupons/bulk-generate', bulkForm);
            alert(`Generated ${data.generated} coupons!`);
            setShowBulk(false);
            fetchCoupons();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Bulk generation failed');
        }
    };

    const inputStyle = {
        padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
        fontSize: '0.85rem', outline: 'none', width: '100%',
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', background: '#ffffff', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Coupon Management</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
                        style={{ padding: '8px 20px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        + New Coupon
                    </button>
                    <button onClick={() => setShowBulk(true)}
                        style={{ padding: '8px 20px', borderRadius: '8px', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Bulk Generate
                    </button>
                </div>
            </div>

            <div className="page-content" style={{ padding: '32px' }}>
                {/* Coupon Table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['CODE', 'TYPE', 'VALUE', 'USED / MAX', 'STATUS', 'EXPIRES', 'ACTIONS'].map((h) => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'ACTIONS' ? 'center' : 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No coupons yet</td></tr>
                            ) : coupons.map((c) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>{c.code}</span>
                                        {c.description && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{c.description}</div>}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{c.discountType}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                                        {c.discountType === 'PERCENT' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                        <span style={{ color: '#0f172a' }}>{c.usedCount}</span>
                                        <span style={{ color: '#94a3b8' }}> / {c.maxUses ?? '∞'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                                            background: c.isActive ? '#dcfce7' : '#fef2f2',
                                            color: c.isActive ? '#16a34a' : '#dc2626',
                                        }}>{c.isActive ? 'Active' : 'Inactive'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                            <button onClick={() => startEdit(c)} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.7rem', cursor: 'pointer', color: '#3b82f6', fontWeight: 700 }}>Edit</button>
                                            <button onClick={() => viewUsage(c.id)} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.7rem', cursor: 'pointer', color: '#64748b', fontWeight: 700 }}>Usage</button>
                                            {c.isActive && <button onClick={() => deactivate(c.id)} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #fef2f2', background: '#fef2f2', fontSize: '0.7rem', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>Deactivate</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Usage Modal */}
                {usageData && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setUsageData(null)}>
                        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: 500, width: '90%', maxHeight: '60vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Usage Report ({usageData.data.length} uses)</h3>
                            {usageData.data.length === 0 ? <p style={{ color: '#94a3b8' }}>No usage recorded yet</p> :
                                usageData.data.map((u: any, i: number) => (
                                    <div key={i} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 0', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#64748b' }}>Order:</span> <span style={{ fontWeight: 600 }}>{u.orderId}</span>
                                        <span style={{ color: '#94a3b8', marginLeft: '12px' }}>{new Date(u.usedAt).toLocaleString()}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setShowForm(false)}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: 500, width: '90%' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>{editingId ? 'Edit Coupon' : 'Create Coupon'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>CODE</label>
                                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} style={inputStyle} placeholder="e.g. SAVE20" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>DESCRIPTION</label>
                                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} placeholder="Optional description" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TYPE</label>
                                    <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })} style={inputStyle}>
                                        <option value="PERCENT">Percent (%)</option>
                                        <option value="FLAT">Flat (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>VALUE</label>
                                    <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>MAX USES</label>
                                    <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} style={inputStyle} placeholder="∞" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>MIN ORDER ₹</label>
                                    <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} style={inputStyle} placeholder="0" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>MAX DISC ₹</label>
                                    <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} style={inputStyle} placeholder="∞" />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>EXPIRES AT</label>
                                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button onClick={handleSubmit} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                                <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Generate Modal */}
            {showBulk && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setShowBulk(false)}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: 420, width: '90%' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>Bulk Generate Coupons</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>COUNT</label>
                                    <input type="number" value={bulkForm.count} onChange={(e) => setBulkForm({ ...bulkForm, count: Number(e.target.value) })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>PREFIX</label>
                                    <input value={bulkForm.prefix} onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value.toUpperCase() })} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TYPE</label>
                                    <select value={bulkForm.discountType} onChange={(e) => setBulkForm({ ...bulkForm, discountType: e.target.value as any })} style={inputStyle}>
                                        <option value="PERCENT">Percent</option>
                                        <option value="FLAT">Flat</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>VALUE</label>
                                    <input type="number" value={bulkForm.discountValue} onChange={(e) => setBulkForm({ ...bulkForm, discountValue: Number(e.target.value) })} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>MAX USES EACH</label>
                                    <input type="number" value={bulkForm.maxUses} onChange={(e) => setBulkForm({ ...bulkForm, maxUses: Number(e.target.value) })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>EXPIRES AT</label>
                                    <input type="date" value={bulkForm.expiresAt} onChange={(e) => setBulkForm({ ...bulkForm, expiresAt: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <button onClick={handleBulkGenerate} style={{ padding: '10px', borderRadius: '8px', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}>
                                Generate {bulkForm.count} Coupons
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
