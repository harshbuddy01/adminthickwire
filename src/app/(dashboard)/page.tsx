'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardStats {
    kpis: {
        totalOrders: number;
        confirmedOrders: number;
        totalRevenue: number;
        pendingOrders: number;
        totalServices: number;
        openTickets: number;
        activeCustomers: number;
        expiringThisWeek: number;
    };
    recentOrders: any[];
    dailyRevenue: { date: string; total: number }[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/admin/dashboard');
                setStats(data);
            } catch (err) { console.error('Dashboard fetch failed', err); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading || !stats) {
        return <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>Loading dashboard...</div>;
    }

    const { kpis, recentOrders, dailyRevenue } = stats;

    const kpiCards = [
        { label: 'MONTHLY ORDERS', value: kpis.totalOrders, sub: 'total orders placed', color: '#64748b', icon: '🎯' },
        { label: 'CONFIRMED', value: kpis.confirmedOrders, sub: 'payments received', color: '#10b981', icon: '✓' },
        { label: 'REVENUE', value: `₹${Number(kpis.totalRevenue).toLocaleString()}`, sub: 'total realized', color: '#3b82f6', icon: '₹' },
        { label: 'PENDING', value: kpis.pendingOrders, sub: 'awaiting fulfillment', color: '#f59e0b', icon: '⏳' },
        { label: 'ACTIVE CUSTOMERS', value: kpis.activeCustomers, sub: 'registered accounts', color: '#8b5cf6', icon: '👥' },
        { label: 'EXPIRING THIS WEEK', value: kpis.expiringThisWeek, sub: 'subscriptions expiring', color: kpis.expiringThisWeek > 0 ? '#dc2626' : '#16a34a', icon: '⚠' },
        { label: 'SERVICES', value: kpis.totalServices, sub: 'active services', color: '#64748b', icon: '📦' },
        { label: 'OPEN TICKETS', value: kpis.openTickets, sub: 'support requests', color: kpis.openTickets > 0 ? '#f59e0b' : '#16a34a', icon: '🎫' },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', minHeight: '100%', background: '#ffffff', paddingBottom: 60 }}>
            <div className="top-header" style={{ borderBottom: '1px solid var(--border)', background: '#ffffff' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>Dashboard Overview</h1>
            </div>

            <div className="page-content" style={{ padding: '32px 32px 48px 32px' }}>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                    {kpiCards.map((card) => (
                        <div key={card.label} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: card.color, letterSpacing: '1px' }}>{card.label}</div>
                                <div style={{ fontSize: '1rem' }}>{card.icon}</div>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', lineHeight: 1 }}>{card.value}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{card.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Revenue Chart */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Weekly Revenue</h3>
                    <div style={{ height: 260, width: '100%' }}>
                        <ResponsiveContainer>
                            <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Orders */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Recent Orders</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>CUSTOMER</th>
                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>SERVICE</th>
                                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>AMOUNT</th>
                                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>PAYMENT</th>
                                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>FULFILLMENT</th>
                                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((o: any) => (
                                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px 16px' }}>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{o.customerName}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{o.customerEmail}</div>
                                    </td>
                                    <td style={{ padding: '10px 16px', color: '#334155' }}>{o.service?.name} • {o.plan?.name}</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>₹{Number(o.amountPaid).toLocaleString()}</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700,
                                            background: o.paymentStatus === 'CONFIRMED' ? '#dcfce7' : o.paymentStatus === 'FAILED' ? '#fef2f2' : '#fefce8',
                                            color: o.paymentStatus === 'CONFIRMED' ? '#16a34a' : o.paymentStatus === 'FAILED' ? '#dc2626' : '#ca8a04',
                                        }}>{o.paymentStatus}</span>
                                    </td>
                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700,
                                            background: o.fulfillmentStatus === 'FULFILLED' ? '#dcfce7' : '#fefce8',
                                            color: o.fulfillmentStatus === 'FULFILLED' ? '#16a34a' : '#ca8a04',
                                        }}>{o.fulfillmentStatus}</span>
                                    </td>
                                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                                        {new Date(o.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
