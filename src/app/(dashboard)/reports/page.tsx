'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface RevenueByService {
    serviceName: string;
    totalRevenue: number;
    orderCount: number;
}

interface RevenueByPlan {
    planName: string;
    serviceName: string;
    totalRevenue: number;
    orderCount: number;
}

interface CouponPerf {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    usedCount: number;
    maxUses: number | null;
    isActive: boolean;
    expiresAt: string | null;
}

export default function ReportsPage() {
    const [tab, setTab] = useState<'service' | 'plan' | 'coupon'>('service');
    const [revenueByService, setRevenueByService] = useState<RevenueByService[]>([]);
    const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
    const [couponPerf, setCouponPerf] = useState<CouponPerf[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [svc, plan, cpn] = await Promise.all([
                    api.get('/admin/reports/revenue-by-service'),
                    api.get('/admin/reports/revenue-by-plan'),
                    api.get('/admin/reports/coupon-performance'),
                ]);
                setRevenueByService(svc.data);
                setRevenueByPlan(plan.data);
                setCouponPerf(cpn.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, []);

    const exportCSV = async () => {
        setExporting(true);
        try {
            const { data: orders } = await api.get('/admin/reports/orders-export');
            // Build CSV
            const header = 'Order ID,Customer,Email,Phone,Service,Plan,Amount,Payment Status,Fulfillment,Date\n';
            const rows = orders.map((o: any) =>
                `${o.id},"${o.customerName}",${o.customerEmail},${o.customerPhone},"${o.service.name}","${o.plan.name}",${o.amountPaid},${o.paymentStatus},${o.fulfillmentStatus},${new Date(o.createdAt).toISOString()}`
            ).join('\n');
            const blob = new Blob([header + rows], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `thickwire-orders-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { console.error(err); alert('Export failed'); }
        finally { setExporting(false); }
    };

    const tabStyle = (active: boolean) => ({
        padding: '10px 24px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 as const,
        cursor: 'pointer' as const, letterSpacing: '0.5px',
        border: active ? '2px solid #0f172a' : '1px solid #e2e8f0',
        background: active ? '#0f172a' : 'white',
        color: active ? 'white' : '#64748b',
    });

    const totalRevenue = revenueByService.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalOrders = revenueByService.reduce((sum, s) => sum + s.orderCount, 0);

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', background: '#ffffff', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Reports & Analytics</h1>
                <button onClick={exportCSV} disabled={exporting}
                    style={{ padding: '8px 20px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            <div className="page-content" style={{ padding: '32px' }}>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>TOTAL REVENUE</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>₹{totalRevenue.toLocaleString()}</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>TOTAL ORDERS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{totalOrders}</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>AVG ORDER VALUE</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>₹{totalOrders ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>ACTIVE COUPONS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{couponPerf.filter(c => c.isActive).length}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <button onClick={() => setTab('service')} style={tabStyle(tab === 'service')}>By Service</button>
                    <button onClick={() => setTab('plan')} style={tabStyle(tab === 'plan')}>By Plan</button>
                    <button onClick={() => setTab('coupon')} style={tabStyle(tab === 'coupon')}>Coupon Performance</button>
                </div>

                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading report data...</div>
                ) : (
                    <>
                        {/* Revenue by Service */}
                        {tab === 'service' && (
                            <div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '16px' }}>Revenue by Service</h3>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={revenueByService} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="serviceName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>SERVICE</th>
                                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>REVENUE</th>
                                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>ORDERS</th>
                                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>AVG</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revenueByService.map((s) => (
                                                <tr key={s.serviceName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{s.serviceName}</td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{s.totalRevenue.toLocaleString()}</td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>{s.orderCount}</td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>₹{Math.round(s.totalRevenue / s.orderCount).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Revenue by Plan */}
                        {tab === 'plan' && (
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>PLAN</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>SERVICE</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>REVENUE</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>ORDERS</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>AVG</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenueByPlan.map((p, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{p.planName}</td>
                                                <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.serviceName}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{p.totalRevenue.toLocaleString()}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>{p.orderCount}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>₹{Math.round(p.totalRevenue / p.orderCount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Coupon Performance */}
                        {tab === 'coupon' && (
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>CODE</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>TYPE</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>VALUE</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>USED / MAX</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>UTILIZATION</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {couponPerf.map((c) => {
                                            const utilization = c.maxUses ? Math.round((c.usedCount / c.maxUses) * 100) : null;
                                            return (
                                                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ fontWeight: 800, fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{c.code}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>{c.discountType}</td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>
                                                        {c.discountType === 'PERCENT' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        <span style={{ fontWeight: 700 }}>{c.usedCount}</span>
                                                        <span style={{ color: '#94a3b8' }}> / {c.maxUses ?? '∞'}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        {utilization !== null ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                                                <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                                                                    <div style={{
                                                                        height: '100%', borderRadius: 3, width: `${Math.min(utilization, 100)}%`,
                                                                        background: utilization >= 80 ? '#dc2626' : utilization >= 50 ? '#ca8a04' : '#16a34a',
                                                                    }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{utilization}%</span>
                                                            </div>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                                                            background: c.isActive ? '#dcfce7' : '#fef2f2',
                                                            color: c.isActive ? '#16a34a' : '#dc2626',
                                                        }}>{c.isActive ? 'Active' : 'Inactive'}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
