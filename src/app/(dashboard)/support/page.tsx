'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Mail, Search, Clock, CheckCircle2, ChevronRight, Reply, RefreshCw, Loader2, User, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SupportTicket {
    id: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    message: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    createdAt: string;
}

export default function SupportInboxPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isReplying, setIsReplying] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/support/admin');
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        setIsReplying(true);
        try {
            await api.post(`/support/admin/${selectedTicket.id}/reply`, { replyText });
            setReplyText('');
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'RESOLVED' } : t));
            setSelectedTicket(null);
        } catch (error) {
            console.error('Failed to reply', error);
        } finally {
            setIsReplying(false);
        }
    };

    const filteredTickets = tickets.filter(t => filter === 'ALL' || t.status === filter);

    const getStatusColors = (status: string) => {
        switch (status) {
            case 'OPEN': return { bg: '#fffbeb', color: '#f59e0b', border: '#fef3c7' };
            case 'RESOLVED': return { bg: '#ecfdf5', color: '#10b981', border: '#d1fae5' };
            default: return { bg: '#eff6ff', color: '#3b82f6', border: '#dbeafe' };
        }
    };

    return (
        <div style={{ padding: '32px', height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Support Inbox</h1>
                    <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.9rem' }}>Manage customer queries and reply directly via email.</p>
                </div>
                <div>
                    <button onClick={fetchTickets} style={{
                        padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', color: '#334155',
                        borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: 600, fontSize: '0.9rem'
                    }}>
                        {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                        Refresh
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
                {/* INBOX PANE */}
                <div style={{ width: '350px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Search & Filters */}
                    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '16px', position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '26px', top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }} />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                style={{
                                    width: '100%', padding: '10px 10px 10px 36px', boxSizing: 'border-box',
                                    border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc',
                                    outline: 'none', fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <div style={{ padding: '0 16px 12px 16px', display: 'flex', gap: '16px', fontSize: '0.85rem', fontWeight: 600, marginTop: '-4px' }}>
                            <span onClick={() => setFilter('ALL')} style={{ cursor: 'pointer', color: filter === 'ALL' ? '#4f46e5' : '#64748b' }}>All</span>
                            <span onClick={() => setFilter('OPEN')} style={{ cursor: 'pointer', color: filter === 'OPEN' ? '#4f46e5' : '#64748b' }}>Open</span>
                            <span onClick={() => setFilter('RESOLVED')} style={{ cursor: 'pointer', color: filter === 'RESOLVED' ? '#4f46e5' : '#64748b' }}>Resolved</span>
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                        {isLoading ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading inbox...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                <Mail size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                                No tickets found.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {filteredTickets.map(ticket => {
                                    const isSelected = selectedTicket?.id === ticket.id;
                                    const statusColors = getStatusColors(ticket.status);

                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            style={{
                                                padding: '16px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0',
                                                background: isSelected ? '#eef2ff' : '#fff',
                                                borderLeft: isSelected ? '4px solid #4f46e5' : '4px solid transparent',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <strong style={{ fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.customerName}</strong>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ticket.subject}
                                            </p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{
                                                    background: statusColors.bg, color: statusColors.color, border: `1px solid ${statusColors.border}`,
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px'
                                                }}>
                                                    {ticket.status}
                                                </span>
                                                {ticket.status === 'OPEN' && <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* REPLY PANE */}
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedTicket ? (
                        <>
                            {/* Head */}
                            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        {selectedTicket.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: '#0f172a' }}>{selectedTicket.subject}</h2>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                                            <strong style={{ color: '#334155' }}>{selectedTicket.customerName}</strong> &lt;{selectedTicket.customerEmail}&gt;
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                                        {new Date(selectedTicket.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', fontSize: '0.95rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {selectedTicket.message}
                                </div>

                                {selectedTicket.status === 'RESOLVED' && (
                                    <div style={{
                                        marginTop: '24px', padding: '16px', background: '#ecfdf5', border: '1px solid #d1fae5',
                                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '12px', color: '#10b981', fontWeight: 600
                                    }}>
                                        <CheckCircle2 size={18} /> Ticket Resolved & Closed
                                    </div>
                                )}
                            </div>

                            {/* Reply Box */}
                            <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        A
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <textarea
                                            disabled={selectedTicket.status === 'RESOLVED' || isReplying}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={selectedTicket.status === 'RESOLVED' ? "Cannot reply to a resolved ticket." : "Type your reply... (Sent directly to customer's email)"}
                                            style={{
                                                width: '100%', minHeight: '120px', padding: '16px', boxSizing: 'border-box',
                                                border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit',
                                                resize: 'vertical', background: selectedTicket.status === 'RESOLVED' ? '#f8fafc' : '#fff',
                                                outline: 'none'
                                            }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                Sending as <strong style={{ color: '#475569' }}>admin@thickwire.com</strong>
                                            </span>
                                            <button
                                                disabled={selectedTicket.status === 'RESOLVED' || !replyText.trim() || isReplying}
                                                onClick={handleReply}
                                                style={{
                                                    padding: '10px 20px', background: (selectedTicket.status === 'RESOLVED' || !replyText.trim()) ? '#94a3b8' : '#4f46e5',
                                                    color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                                                    cursor: (selectedTicket.status === 'RESOLVED' || !replyText.trim()) ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {isReplying ? <Loader2 size={16} /> : <Reply size={16} />}
                                                Send Reply & Resolve
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#f8fafc' }}>
                            <div style={{ width: '80px', height: '80px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <HelpCircle size={36} color="#cbd5e1" />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '1.2rem' }}>Select a Ticket</h3>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>Select a support ticket from the inbox to read and reply.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
