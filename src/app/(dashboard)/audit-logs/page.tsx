'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { AuditLog, Paginated } from '@/lib/types';

export default function AuditLogsPage() {
    const [data, setData] = useState<Paginated<AuditLog>>({ items: [], total: 0, page: 1, limit: 50 });
    const [page, setPage] = useState(1);

    useEffect(() => {
        api.get(`/admin/audit-logs?page=${page}`).then(({ data }) => setData(data));
    }, [page]);

    return (
        <>
            <div className="top-header"><h1>Audit Logs</h1></div>
            <div className="page-content">
                <div className="table-card">
                    <table>
                        <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>IP</th></tr></thead>
                        <tbody>
                            {data.items.map(log => (
                                <tr key={log.id}>
                                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.adminId.slice(0, 8)}</td>
                                    <td><span className="badge badge-accent">{log.action}</span></td>
                                    <td>{log.entityType}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.entityId.slice(0, 8)}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ipAddress || '—'}</td>
                                </tr>
                            ))}
                            {data.items.length === 0 && <tr><td colSpan={6} className="table-empty">No audit logs</td></tr>}
                        </tbody>
                    </table>
                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                        <span>Page {data.page} of {Math.ceil(data.total / data.limit) || 1}</span>
                        <button disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                </div>
            </div>
        </>
    );
}
