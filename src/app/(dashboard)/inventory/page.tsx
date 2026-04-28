'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import type { Service } from '@/lib/types';

export default function InventoryPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [plans, setPlans] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [mode, setMode] = useState<'table' | 'single' | 'csv'>('table');
    const [singleContent, setSingleContent] = useState('');
    const [csvData, setCsvData] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get('/services/admin/list').then(({ data }) => setServices(data));
    }, []);

    const loadPlans = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        setSelectedPlanId('');
        setItems([]);
        setTotal(0);
        if (!serviceId) return;
        api.get(`/services/admin/${serviceId}/plans`).then(({ data }) => {
            setPlans(data);
            if (data[0]) {
                setSelectedPlanId(data[0].id);
            }
        });
    };

    const fetchItems = async () => {
        if (!selectedPlanId) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/inventory/plan/${selectedPlanId}?page=${page}`);
            setItems(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error('Failed to load inventory', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedPlanId) return;
        fetchItems();
    }, [selectedPlanId, page]);

    const handleSingle = async () => {
        if (!singleContent.trim()) return;
        await api.post('/inventory/single', { planId: selectedPlanId, content: singleContent });
        setSingleContent(''); setMessage('✅ Item added successfully!'); setMode('table');
        fetchItems();
        setTimeout(() => setMessage(''), 4000);
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            setCsvData(lines);
        };
        reader.readAsText(file);
    };

    const handleBulkUpload = async () => {
        if (csvData.length === 0) return;
        await api.post('/inventory/bulk', { planId: selectedPlanId, contents: csvData });
        setCsvData([]); setMessage(`✅ ${csvData.length} items uploaded successfully!`); setMode('table');
        fetchItems();
        setTimeout(() => setMessage(''), 4000);
    };

    const toggleReveal = (id: string) => {
        setRevealedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const maskCredential = (content: string) => {
        if (!content) return '••••••••';
        if (content.includes(':')) {
            const [email, pass] = [content.split(':')[0], content.substring(content.indexOf(':') + 1)];
            const maskedEmail = email.length > 4 ? email.slice(0, 4) + '••••' + (email.includes('@') ? '@' + email.split('@')[1] : '') : email;
            return `${maskedEmail} : ${'•'.repeat(Math.min(pass.length, 8))}`;
        }
        return content.slice(0, 6) + '••••••';
    };

    const availableCount = items.filter(i => !i.isUsed).length;
    const usedCount = items.filter(i => i.isUsed).length;

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Inventory</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select
                        className="form-select"
                        style={{ width: 180 }}
                        value={selectedServiceId}
                        onChange={e => loadPlans(e.target.value)}
                    >
                        <option value="">Select Service</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {plans.length > 0 && (
                        <select
                            className="form-select"
                            style={{ width: 180 }}
                            value={selectedPlanId}
                            onChange={e => setSelectedPlanId(e.target.value)}
                        >
                            {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            <div className="page-content" style={{ padding: '32px' }}>
                {message && (
                    <div style={{
                        padding: '12px 20px', borderRadius: '10px', background: '#dcfce7',
                        border: '1px solid #bbf7d0', color: '#166534', fontWeight: 600,
                        fontSize: '0.85rem', marginBottom: 24, animation: 'fadeIn 0.3s ease-out'
                    }}>{message}</div>
                )}

                {/* Stats Strip */}
                {selectedPlanId && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{
                            flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                            padding: '16px 20px', borderTop: '3px solid #4F46E5'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Items</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{total}</div>
                        </div>
                        <div style={{
                            flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                            padding: '16px 20px', borderTop: '3px solid #16A34A'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{availableCount}</div>
                        </div>
                        <div style={{
                            flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                            padding: '16px 20px', borderTop: '3px solid #D97706'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Used / Sent</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>{usedCount}</div>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <button className={`btn ${mode === 'table' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('table')}>View Items</button>
                    <button className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('single')} disabled={!selectedPlanId}>+ Single Add</button>
                    <button className={`btn ${mode === 'csv' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('csv')} disabled={!selectedPlanId}>📁 CSV Upload</button>
                </div>

                {mode === 'single' && (
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: 24 }}>
                        <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: '1rem' }}>Add Single Credential</h3>
                        <div className="form-group">
                            <label className="form-label">Content (email:password format)</label>
                            <textarea className="form-input" placeholder="email@example.com:password123" value={singleContent} onChange={e => setSingleContent(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" onClick={handleSingle}>Add Item</button>
                    </div>
                )}

                {mode === 'csv' && (
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: 24 }}>
                        <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: '1rem' }}>CSV Bulk Upload</h3>
                        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                            <div className="upload-zone-icon">📁</div>
                            <p>Click to upload a CSV/TXT file</p>
                            <p className="hint">One credential per line (email:password)</p>
                        </div>
                        <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />
                        {csvData.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                                <p style={{ marginBottom: 12 }}><strong>{csvData.length}</strong> items parsed. Preview:</p>
                                <div style={{ maxHeight: 200, overflow: 'auto', background: '#f8fafc', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                                    {csvData.slice(0, 10).map((line, i) => <div key={i}>{line}</div>)}
                                    {csvData.length > 10 && <div style={{ color: '#94a3b8' }}>... and {csvData.length - 10} more</div>}
                                </div>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleBulkUpload}>Upload {csvData.length} Items</button>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'table' && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Inventory ({total} total)</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>CREDENTIAL</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>SENT TO CUSTOMER</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>DELIVERED DATE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>EXPIRY DATE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} style={{ padding: '16px' }}>
                                                    <div className="skeleton" style={{ height: 16, borderRadius: 6, width: j === 0 ? '80%' : '60%' }}></div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : items.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                                        {selectedPlanId ? 'No inventory for this plan' : 'Select a service and plan to view inventory'}
                                    </td></tr>
                                ) : items.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#334155' }}>
                                            {revealedIds.has(item.id) && item.decryptedContent
                                                ? item.decryptedContent
                                                : maskCredential(item.decryptedContent || '')
                                            }
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                                                background: item.isUsed ? '#fef3c7' : '#dcfce7',
                                                color: item.isUsed ? '#92400e' : '#166534',
                                            }}>
                                                {item.isUsed ? '✓ Sent' : 'Available'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {item.order ? (
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>{item.order.customerName}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.order.customerEmail}</div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                            {item.usedAt ? new Date(item.usedAt).toLocaleDateString() : <span style={{ color: '#cbd5e1' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                            {item.order?.subscriptionExpiry?.expiresAt
                                                ? new Date(item.order.subscriptionExpiry.expiresAt).toLocaleDateString()
                                                : <span style={{ color: '#cbd5e1' }}>—</span>
                                            }
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => toggleReveal(item.id)}
                                                style={{
                                                    padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700,
                                                    border: '1px solid #e2e8f0', background: revealedIds.has(item.id) ? '#0f172a' : 'white',
                                                    color: revealedIds.has(item.id) ? 'white' : '#334155',
                                                    borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
                                                }}
                                            >
                                                {revealedIds.has(item.id) ? 'Hide' : 'Reveal'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {total > 50 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Prev</button>
                                <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#64748b' }}>Page {page} of {Math.ceil(total / 50)}</span>
                                <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}
                                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
