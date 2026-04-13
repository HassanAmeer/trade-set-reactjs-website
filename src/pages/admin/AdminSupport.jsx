import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MessageSquare, Send, CheckCircle2, Trash2, ExternalLink, Image as ImageIcon, Camera, Loader2, User, Phone, Mail, Clock, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileChunks } from '../../services/dbs';
import { sendEmail } from '../../services/emailService';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState({});
    const [replyImages, setReplyImages] = useState({});
    const [sending, setSending] = useState(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const fileInputRefs = useRef({});

    useEffect(() => {
        const q = query(collection(db, 'support_messages'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                ...doc.data()
            }));
            setTickets(list);
            setLoading(false);
            if (!selectedTicket && list.length > 0) setSelectedTicket(list[0]);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this ticket Permanently?')) return;
        try {
            await deleteDoc(doc(db, 'support_messages', id));
            if (selectedTicket?.id === id) setSelectedTicket(null);
        } catch (error) {
            alert('Error deleting');
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, 'support_messages', id), { status: newStatus });
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleReplyImageSelect = (ticketId, e) => {
        const files = Array.from(e.target.files);
        const existing = replyImages[ticketId] || [];
        setReplyImages({ ...replyImages, [ticketId]: [...existing, ...files] });
    };

    const removeReplyImage = (ticketId, index) => {
        const existing = replyImages[ticketId] || [];
        const filtered = existing.filter((_, i) => i !== index);
        setReplyImages({ ...replyImages, [ticketId]: filtered });
    };

    const handleReply = async (ticket) => {
        const text = replyText[ticket.id];
        const files = replyImages[ticket.id] || [];
        if (!text && files.length === 0) return;

        setSending(ticket.id);
        let uploadedReplyUrls = [];

        try {
            if (files.length > 0) {
                for (const file of files) {
                    const res = await uploadFileChunks(file);
                    if (res.success) uploadedReplyUrls.push(res.url);
                }
            }
            await updateDoc(ticket.ref, {
                status: 'replied',
                reply: text || 'Resolution provided via attachment',
                replyImages: uploadedReplyUrls,
                repliedAt: new Date().toISOString()
            });
            if (ticket.userId !== 'guest') {
                await addDoc(collection(db, 'users', ticket.userId, 'messages'), {
                    type: 'info',
                    title: 'Support Resolution',
                    description: text || 'Admin sent a resolution with images.',
                    replyImages: uploadedReplyUrls,
                    timestamp: new Date().toISOString(),
                    ticketId: ticket.id
                });

                // Trigger Email Notification
                await sendEmail('multi', {
                    to_email: ticket.userEmail,
                    user_name: 'Value Member',
                    headline: 'Support Request Resolved',
                    description: `Hello, we have officially responded to your support inquiry regarding: "${ticket.content.substring(0, 50)}..."`,
                    data_title: 'Ticket ID',
                    data_value: ticket.id,
                    button_text: 'View My Inbox',
                    button_url: `${window.location.origin}/inbox`
                });
            }
            setReplyText({ ...replyText, [ticket.id]: '' });
            setReplyImages({ ...replyImages, [ticket.id]: [] });
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSending(null);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchFilter = filter === 'all' || t.status === filter;
        const matchSearch = t.userEmail.toLowerCase().includes(search.toLowerCase()) || (t.phone && t.phone.includes(search));
        return matchFilter && matchSearch;
    });

    if (loading) return <div style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '10px', padding: '50px' }}><Loader2 className="animate-spin" /> Fetching support data...</div>;

    return (
        <div className="support-layout">
            {/* Sidebar: Ticket List */}
            <div className="support-sidebar">
                <div style={{ padding: '20px', borderBottom: '1px solid #111' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#00c087', marginBottom: '15px' }}>Inquiries</h2>
                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                        <Filter size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: '#444' }} />
                        <input
                            placeholder="Search by email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px 10px 35px', background: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {['all', 'unread', 'replied'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', border: 'none', cursor: 'pointer', background: filter === f ? '#00c087' : '#1a1a1a', color: filter === f ? '#000' : '#888', textTransform: 'uppercase' }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredTickets.map(t => (
                        <div
                            key={t.id}
                            onClick={() => setSelectedTicket(t)}
                            style={{
                                padding: '15px 20px',
                                borderBottom: '1px solid #111',
                                cursor: 'pointer',
                                background: selectedTicket?.id === t.id ? 'rgba(0,192,135,0.05)' : 'transparent',
                                borderLeft: selectedTicket?.id === t.id ? '4px solid #00c087' : '4px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: selectedTicket?.id === t.id ? '#00c087' : '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{t.userEmail}</span>
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: t.status === 'unread' ? '#ff4d4f' : '#222', color: '#fff' }}>{t.status}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>{new Date(t.timestamp).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content: Ticket Detail */}
            <div className="support-main">
                {selectedTicket ? (
                    <>
                        <div style={{ padding: '25px 35px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: 'linear-gradient(45deg, #00c087, #0056b3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{selectedTicket.userEmail}</h3>
                                    <div style={{ fontSize: '13px', color: '#555', display: 'flex', gap: '15px', marginTop: '2px' }}>
                                        <span><Phone size={12} /> {selectedTicket.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleDelete(selectedTicket.id)} style={{ padding: '8px', color: '#ff4d4f', background: 'rgba(255,77,79,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '35px' }}>
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#00c087', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '15px' }}>
                                    <MessageSquare size={14} /> Opening Request
                                </div>
                                <div style={{ background: '#111', padding: '25px', borderRadius: '16px', border: '1px solid #1a1a1a', color: '#eee', lineHeight: '1.7', fontSize: '15px' }}>
                                    {selectedTicket.content}

                                    {(selectedTicket.imageUrls || selectedTicket.imageUrl) && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
                                            {[...(selectedTicket.imageUrls || []), ...(selectedTicket.imageUrl ? [selectedTicket.imageUrl] : [])].map((img, i) => (
                                                <img
                                                    key={i}
                                                    src={img}
                                                    onClick={() => window.open(img, '_blank')}
                                                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #222', cursor: 'pointer' }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedTicket.status === 'replied' && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#00c087', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '15px' }}>
                                        <CheckCircle2 size={14} /> Official Resolution
                                    </div>
                                    <div style={{ background: 'rgba(0,192,135,0.05)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(0,192,135,0.1)', color: '#00c087', lineHeight: '1.7', fontSize: '15px' }}>
                                        {selectedTicket.reply}
                                        {selectedTicket.replyImages && (
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                {selectedTicket.replyImages.map((img, i) => (
                                                    <img key={i} src={img} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {selectedTicket.status !== 'replied' && (
                            <div style={{ padding: '30px 35px', background: '#0c0c0c', borderTop: '1px solid #111' }}>
                                {/* Image Previews before dispatch */}
                                {replyImages[selectedTicket.id]?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', overflowX: 'auto' }}>
                                        {replyImages[selectedTicket.id].map((file, i) => (
                                            <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #00c087' }}>
                                                <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    onClick={() => removeReplyImage(selectedTicket.id, i)}
                                                    style={{ position: 'absolute', top: 0, right: 0, background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '0 0 0 8px', padding: '2px 5px', cursor: 'pointer', fontSize: '10px' }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    value={replyText[selectedTicket.id] || ''}
                                    onChange={(e) => setReplyText({ ...replyText, [selectedTicket.id]: e.target.value })}
                                    placeholder="Type your official resolution..."
                                    style={{ width: '100%', height: '100px', background: '#111', border: '1px solid #222', borderRadius: '12px', color: '#fff', padding: '15px', outline: 'none', resize: 'none', fontSize: '14px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => fileInputRefs.current[selectedTicket.id]?.click()}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#111', border: '1px solid #222', borderRadius: '8px', color: '#888', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                            <Camera size={16} /> Attach Files {(replyImages[selectedTicket.id]?.length > 0) && `(${replyImages[selectedTicket.id].length})`}
                                        </button>
                                        <input type="file" multiple ref={el => fileInputRefs.current[selectedTicket.id] = el} onChange={(e) => handleReplyImageSelect(selectedTicket.id, e)} style={{ display: 'none' }} />
                                    </div>
                                    <button
                                        onClick={() => handleReply(selectedTicket)}
                                        disabled={sending === selectedTicket.id}
                                        style={{ padding: '10px 30px', background: '#00c087', color: '#000', fontWeight: '900', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                    >
                                        {sending === selectedTicket.id ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Reply</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                        <MessageSquare size={80} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <span style={{ fontSize: '18px', fontWeight: '700' }}>Select a ticket to begin resolution</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
