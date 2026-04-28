'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Common pure SVG icons instead of emojis
const Icons = {
    Dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>,
    List: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    Map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>,
    Users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    Package: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    Database: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
    Bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
    UserCircle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    Logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
    Target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
};

const navItems = [
    { label: 'Overview', icon: Icons.Dashboard, href: '/' },
    { label: 'Services List', icon: Icons.List, href: '/services' },
    { label: 'Orders Pipeline', icon: Icons.Package, href: '/orders' },
    { label: 'Inventory', icon: Icons.Database, href: '/inventory' },
    { label: 'Customers', icon: Icons.Users, href: '/customers' },
    { label: 'Subscriptions', icon: Icons.Target, href: '/subscriptions' },
    { label: 'Coupons', icon: Icons.Package, href: '/coupons' }, // Kept package for Coupons, could change icon later
    { label: 'Reports', icon: Icons.List, href: '/reports' },
    { label: 'Support Tickets', icon: Icons.Map, href: '/support' }, // Temporary map/target icon
];

const adminItems = [
    { label: 'System Users', icon: Icons.Users, href: '/users' },
    { label: 'System Settings', icon: Icons.Settings, href: '/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading || !user) return null;

    return (
        <div className="admin-layout">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
                />
            )}

            <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo">
                    ThickWire
                    <span style={{ marginLeft: '4px', display: 'flex', alignItems: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg></span>
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}
                                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
                                <span className="sidebar-link-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    {user.role === 'SUPER_ADMIN' && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-label">Administration</div>
                            {adminItems.map((item) => (
                                <Link key={item.href} href={item.href}
                                    className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
                                    <span className="sidebar-link-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer" style={{ borderTop: 'none', padding: '16px 24px', paddingBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                            <div className="sidebar-user-name" style={{ color: '#0f172a' }}>{user.email.split('@')[0]}</div>
                            <div className="sidebar-user-role" style={{ color: '#8b5cf6' }}>{user.role}</div>
                        </div>
                        <button onClick={logout} style={{
                            marginTop: '12px', background: 'transparent', border: 'none', color: '#ef4444',
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: 600, padding: '4px 0'
                        }}>
                            {Icons.Logout} Logout
                        </button>
                    </div>
                </div>
            </aside>

            <div className="main-content">
                <div className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#64748b' }}>
                        <div
                            className="mobile-menu-btn"
                            style={{ display: 'none', cursor: 'pointer', marginRight: '8px' }}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </div>
                        <span className="welcome-text">Welcome back,</span> <span style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>{user.email.split('@')[0]}</span>
                        {user.role === 'SUPER_ADMIN' && (
                            <span style={{
                                background: '#f5f3ff', color: '#8b5cf6', padding: '4px 8px', borderRadius: '12px',
                                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px'
                            }}>
                                SYSTEM OWNER <svg style={{ display: 'inline', marginLeft: '2px', verticalAlign: 'text-bottom' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ color: '#64748b', cursor: 'pointer' }}>{Icons.Bell}</div>
                        <div style={{ color: '#64748b', cursor: 'pointer' }}>{Icons.UserCircle}</div>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}
