import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState({});
    const [sending, setSending] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'support_messages'));
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                ...doc.data()
            }));
            
            list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setTickets(list);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (ticket) => {
        const text = replyText[ticket.id];
        if (!text) return;
        setSending(ticket.id);

        try {
            // Update ticket
            await updateDoc(ticket.ref, {
                status: 'replied',
                reply: text,
                repliedAt: new Date().toISOString()
            });

            // Push to user inbox
            if (ticket.userId !== 'guest') {
                await addDoc(collection(db, 'users', ticket.userId, 'messages'), {
                    type: 'info',
                    title: 'Customer Support Reply',
                    description: text,
                    timestamp: new Date().toISOString(),
                    ticketId: ticket.id
                });
            }

            alert('Reply sent successfully!');
            fetchTickets();
            setReplyText({ ...replyText, [ticket.id]: '' });
        } catch (error) {
            alert('Failed to send reply');
        } finally {
            setSending(null);
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading support tickets...</div>;

    return (
        <div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Support Center</h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
                {tickets.map((ticket) => (
                    <div key={ticket.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>{ticket.userEmail}</div>
                                <div style={{ fontSize: '13px', color: '#888' }}>Phone: {ticket.phone} | {new Date(ticket.timestamp).toLocaleString()}</div>
                            </div>
                            <div>
                                <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '12px', 
                                    fontSize: '11px', 
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    backgroundColor: ticket.status === 'replied' ? 'rgba(0,192,135,0.1)' : 'rgba(255,184,0,0.1)',
                                    color: ticket.status === 'replied' ? '#00c087' : '#ffb800'
                                }}>
                                    {ticket.status}
                                </span>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', color: '#eee', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
                            {ticket.content}
                        </div>

                        {ticket.status === 'replied' ? (
                            <div style={{ borderLeft: '3px solid #00c087', paddingLeft: '15px' }}>
                                <div style={{ fontSize: '12px', color: '#00c087', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={14} /> Admin Reply ({new Date(ticket.repliedAt).toLocaleString()})
                                </div>
                                <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.5' }}>
                                    {ticket.reply}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    value={replyText[ticket.id] || ''} 
                                    onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                                    placeholder="Type your reply to this user..." 
                                    style={{ flex: 1, padding: '12px 15px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                />
                                <button 
                                    onClick={() => handleReply(ticket)}
                                    disabled={sending === ticket.id || !replyText[ticket.id]}
                                    style={{ backgroundColor: '#00c087', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: (sending === ticket.id || !replyText[ticket.id]) ? 'not-allowed' : 'pointer', opacity: (sending === ticket.id || !replyText[ticket.id]) ? 0.6 : 1 }}
                                >
                                    <Send size={16} /> Send
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {tickets.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                        <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <div>No support tickets at the moment.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
