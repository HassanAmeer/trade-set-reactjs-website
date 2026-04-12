import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MessageSquare, Send, CheckCircle2, Trash2, ExternalLink, Image as ImageIcon, Camera, Loader2, User, Phone, Mail, Clock, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileChunks } from '../../services/dbs';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState({});
    const [replyImages, setReplyImages] = useState({});
    const [sending, setSending] = useState(null);
    const [filter, setFilter] = useState('all');
    const [uploadingImage, setUploadingImage] = useState(null);
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
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await deleteDoc(doc(db, 'support_messages', id));
        } catch (error) {
            alert('Failed to delete ticket');
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
        if (files.length > 0) {
            const existing = replyImages[ticketId] || [];
            setReplyImages({ ...replyImages, [ticketId]: [...existing, ...files] });
        }
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
            // Upload Multiple Reply Images
            if (files.length > 0) {
                setUploadingImage(ticket.id);
                for (const file of files) {
                    const res = await uploadFileChunks(file);
                    if (res.success) uploadedReplyUrls.push(res.url);
                }
            }

            // 1. Update ticket
            await updateDoc(ticket.ref, {
                status: 'replied',
                reply: text || 'View attached images',
                replyImages: uploadedReplyUrls, // Array 
                repliedAt: new Date().toISOString()
            });

            // 2. Push to user inbox
            if (ticket.userId !== 'guest') {
                await addDoc(collection(db, 'users', ticket.userId, 'messages'), {
                    type: 'info',
                    title: 'Customer Support Reply',
                    description: text || 'Admin replied with images.',
                    replyImages: uploadedReplyUrls, // Array
                    timestamp: new Date().toISOString(),
                    ticketId: ticket.id
                });
            }

            alert('Reply sent successfully!');
            setReplyText({ ...replyText, [ticket.id]: '' });
            setReplyImages({ ...replyImages, [ticket.id]: [] });
        } catch (error) {
            alert('Failed to send reply: ' + error.message);
        } finally {
            setSending(null);
            setUploadingImage(null);
        }
    };

    const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }}>
            <Loader2 className="animate-spin" /> Loading support hub...
        </div>
    );

    return (
        <div style={{ color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#00c087', margin: 0 }}>Support Hub</h2>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>Manage user complaints and inquiries in real-time</p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['all', 'unread', 'replied', 'resolved'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid #222',
                                backgroundColor: filter === f ? '#00c087' : '#111',
                                color: filter === f ? '#fff' : '#888',
                                fontSize: '12px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            
            <div style={{ display: 'grid', gap: '25px' }}>
                <AnimatePresence>
                    {filteredTickets.map((ticket) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={ticket.id}
                            style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                        >
                            <div style={{ padding: '20px 25px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161616' }}>
                                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(0,192,135,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c087' }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{ticket.userEmail}</div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} /> {ticket.phone}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {new Date(ticket.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <select 
                                        value={ticket.status} 
                                        onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                        style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', outline: 'none' }}
                                    >
                                        <option value="unread">Unread</option>
                                        <option value="pending">Pending</option>
                                        <option value="replied">Replied</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <button onClick={() => handleDelete(ticket.id)} style={{ padding: '8px', color: '#ff4d4f', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Delete Ticket">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '25px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: (ticket.imageUrl || (ticket.imageUrls && ticket.imageUrls.length > 0)) ? '1fr 200px' : '1fr', gap: '20px' }}>
                                    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #00c087', color: '#ccc', fontSize: '15px', lineHeight: '1.6' }}>
                                        {ticket.content}
                                    </div>
                                    
                                    {(ticket.imageUrl || ticket.imageUrls) && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {[...(ticket.imageUrls || []), ...(ticket.imageUrl ? [ticket.imageUrl] : [])].map((img, i) => (
                                                <div key={i} style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')}>
                                                    <img src={img} alt="User Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '25px', paddingTop: '25px', borderTop: '1px solid #222' }}>
                                    {ticket.status === 'replied' ? (
                                        <div style={{ backgroundColor: 'rgba(0,192,135,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,192,135,0.1)' }}>
                                            <div style={{ fontSize: '13px', color: '#00c087', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CheckCircle2 size={16} /> ADMINISTRATOR RESPONSE
                                            </div>
                                            <div style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.5' }}>{ticket.reply}</div>
                                            {(ticket.replyImage || ticket.replyImages) && (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                                    {[...(ticket.replyImages || []), ...(ticket.replyImage ? [ticket.replyImage] : [])].map((img, i) => (
                                                        <img key={i} src={img} alt="Reply" style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ fontSize: '13px', color: '#888', fontWeight: '700' }}>Admin Reply</div>
                                            <textarea 
                                                value={replyText[ticket.id] || ''} 
                                                onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                                                placeholder="Write a clear resolution for the user..." 
                                                style={{ width: '100%', height: '80px', padding: '15px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', outline: 'none', resize: 'none' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        {(replyImages[ticket.id] || []).map((img, i) => (
                                                            <div key={i} style={{ position: 'relative' }}>
                                                                <ImageIcon size={16} color="#00c087" />
                                                                <button onClick={() => removeReplyImage(ticket.id, i)} style={{ position: 'absolute', top: -10, right: -10, fontSize: '10px', color: '#ff4d4f', background: 'none', border: 'none' }}>×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button 
                                                        onClick={() => fileInputRefs.current[ticket.id]?.click()}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        <Camera size={16} /> { (replyImages[ticket.id]?.length > 0) ? `${replyImages[ticket.id].length} Files` : 'Attach Screenshot'}
                                                    </button>
                                                    <input 
                                                        type="file" 
                                                        ref={el => fileInputRefs.current[ticket.id] = el}
                                                        onChange={(e) => handleReplyImageSelect(ticket.id, e)}
                                                        multiple
                                                        style={{ display: 'none' }}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => handleReply(ticket)}
                                                    disabled={sending === ticket.id || (!replyText[ticket.id] && (!replyImages[ticket.id] || replyImages[ticket.id].length === 0))}
                                                    style={{ backgroundColor: '#00c087', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: (sending === ticket.id) ? 0.6 : 1 }}
                                                >
                                                    {sending === ticket.id ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Dispatch Resolution</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminSupport;
