'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import type { Service } from '@/lib/types';

export default function InventoryPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [plans, setPlans] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [mode, setMode] = useState<'table' | 'single' | 'csv'>('table');
    const [singleContent, setSingleContent] = useState('');
    const [csvData, setCsvData] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get('/services/admin/list').then(({ data }) => setServices(data));
    }, []);

    const loadPlans = (serviceId: string) => {
        api.get(`/services/admin/${serviceId}/plans`).then(({ data }) => { setPlans(data); if (data[0]) setSelectedPlanId(data[0].id); });
    };

    useEffect(() => {
        if (!selectedPlanId) return;
        api.get(`/inventory/plan/${selectedPlanId}?page=${page}`).then(({ data }) => { setItems(data.items); setTotal(data.total); });
    }, [selectedPlanId, page]);

    const handleSingle = async () => {
        if (!singleContent.trim()) return;
        await api.post('/inventory/single', { planId: selectedPlanId, content: singleContent });
        setSingleContent(''); setMessage('Item added!'); setMode('table');
        api.get(`/inventory/plan/${selectedPlanId}?page=1`).then(({ data }) => { setItems(data.items); setTotal(data.total); });
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
        setCsvData([]); setMessage(`${csvData.length} items uploaded!`); setMode('table');
        api.get(`/inventory/plan/${selectedPlanId}?page=1`).then(({ data }) => { setItems(data.items); setTotal(data.total); });
    };

    return (
        <>
            <div className="top-header">
                <h1>Inventory</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select className="form-select" style={{ width: 160 }} onChange={e => loadPlans(e.target.value)}>
                        <option value="">Select Service</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {plans.length > 0 && (
                        <select className="form-select" style={{ width: 160 }} value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
                            {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    )}
                </div>
            </div>
            <div className="page-content">
                {message && <div className="alert alert-success">{message}</div>}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <button className={`btn ${mode === 'table' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('table')}>View Items</button>
                    <button className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('single')} disabled={!selectedPlanId}>+ Single Add</button>
                    <button className={`btn ${mode === 'csv' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('csv')} disabled={!selectedPlanId}>📁 CSV Upload</button>
                </div>

                {mode === 'single' && (
                    <div className="table-card" style={{ padding: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>Add Single Item</h3>
                        <div className="form-group">
                            <label className="form-label">Content (credential/key)</label>
                            <textarea className="form-input" placeholder="Enter the credential content..." value={singleContent} onChange={e => setSingleContent(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" onClick={handleSingle}>Add Item</button>
                    </div>
                )}

                {mode === 'csv' && (
                    <div className="table-card" style={{ padding: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>CSV Bulk Upload</h3>
                        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                            <div className="upload-zone-icon">📁</div>
                            <p>Click to upload a CSV/TXT file</p>
                            <p className="hint">One credential per line</p>
                        </div>
                        <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />
                        {csvData.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                                <p style={{ marginBottom: 12 }}><strong>{csvData.length}</strong> items parsed. Preview:</p>
                                <div style={{ maxHeight: 200, overflow: 'auto', background: 'var(--bg-input)', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {csvData.slice(0, 10).map((line, i) => <div key={i}>{line}</div>)}
                                    {csvData.length > 10 && <div style={{ color: 'var(--text-muted)' }}>... and {csvData.length - 10} more</div>}
                                </div>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleBulkUpload}>Upload {csvData.length} Items</button>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'table' && (
                    <div className="table-card">
                        <div className="table-header"><h3>Inventory ({total} total)</h3></div>
                        <table>
                            <thead><tr><th>ID</th><th>Status</th><th>Used At</th><th>Order</th><th>Created</th></tr></thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.id.slice(0, 8)}</td>
                                        <td><span className={`badge ${item.isUsed ? 'badge-muted' : 'badge-success'}`}>{item.isUsed ? 'Used' : 'Available'}</span></td>
                                        <td>{item.usedAt ? new Date(item.usedAt).toLocaleDateString() : '—'}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.orderId?.slice(0, 8) || '—'}</td>
                                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {items.length === 0 && <tr><td colSpan={5} className="table-empty">No inventory for this plan</td></tr>}
                            </tbody>
                        </table>
                        {total > 50 && (
                            <div className="pagination">
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <span>Page {page} of {Math.ceil(total / 50)}</span>
                                <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
