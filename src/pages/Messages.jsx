import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Bell, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { collection, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';

const Messages = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState(null); // full detail modal
    const [selectedImg, setSelectedImg] = useState(null); // image zoom modal

    useEffect(() => {
        if (user) {
            fetchMessages();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchMessages = async () => {
        try {
            const q = query(
                collection(db, 'users', user.id, 'messages'),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(d => ({
                id: d.id,
                ref: d.ref,
                ...d.data()
            }));
            setMessages(list);

            // Batch-mark all unread messages as read
            const unread = querySnapshot.docs.filter(d => d.data().read === false);
            if (unread.length > 0) {
                const batch = writeBatch(db);
                unread.forEach(d => batch.update(d.ref, { read: true }));
                await batch.commit();
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const getAccent = (title) => {
        if (title?.includes('✅')) return '#00c087';
        if (title?.includes('❌')) return '#ff4d4f';
        if (title?.includes('🕐')) return '#ffb800';
        return 'var(--accent-gold)';
    };

    const getBg = (title) => {
        if (title?.includes('✅')) return 'rgba(0,192,135,0.05)';
        if (title?.includes('❌')) return 'rgba(255,77,79,0.05)';
        if (title?.includes('🕐')) return 'rgba(255,184,0,0.05)';
        return 'rgba(255,255,255,0.02)';
    };

    const getEmoji = (title) => {
        if (title?.includes('✅')) return '✅';
        if (title?.includes('❌')) return '❌';
        if (title?.includes('🕐')) return '🕐';
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 40px 0', color: '#fff' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '16px',
                borderBottom: '1px solid #222', background: 'var(--bg-primary)',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>Inbox</h1>
            </div>

            {/* Message List */}
            <div style={{ padding: '0' }}>
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: '1px solid #1a1a1a' }}>
                                <div className="skeleton-loader" style={{ width: '44px', height: '44px', borderRadius: '50%' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton-loader" style={{ width: '40%', height: '14px', marginBottom: '8px' }}></div>
                                    <div className="skeleton-loader" style={{ width: '80%', height: '10px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && messages.map((msg) => {
                    const accent = getAccent(msg.title);
                    const bg = getBg(msg.title);
                    const emoji = getEmoji(msg.title);

                    return (
                        <div
                            key={msg.id}
                            onClick={() => setSelectedMsg(msg)}
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid #1a1a1a',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                backgroundColor: bg,
                                borderLeft: `3px solid ${accent}`,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                background: `${accent}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '20px'
                            }}>
                                {emoji || <Bell size={20} color={accent} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', lineHeight: '1.3' }}>
                                        {msg.title}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#555', flexShrink: 0 }}>
                                        {new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: '12px', color: '#777', margin: '4px 0 0 0', lineHeight: '1.4',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                }}>
                                    {msg.description}
                                </p>
                            </div>
                            <ChevronRight size={16} color="#333" style={{ flexShrink: 0 }} />
                        </div>
                    );
                })}

                {!loading && messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#555' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#444', marginBottom: '8px' }}>No messages yet</div>
                        <div style={{ fontSize: '13px', color: '#333' }}>KYC updates & notifications will appear here</div>
                    </div>
                )}
            </div>

            {/* Full Message Detail Modal */}
            <AnimatePresence>
                {selectedMsg && (() => {
                    const accent = getAccent(selectedMsg.title);
                    const emoji = getEmoji(selectedMsg.title);
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 2000,
                                backgroundColor: 'rgba(0,0,0,0.9)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                padding: '0'
                            }}
                            onClick={() => setSelectedMsg(null)}
                        >
                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    maxWidth: '480px',
                                    backgroundColor: '#0d0d0d',
                                    borderRadius: '24px 24px 0 0',
                                    padding: '0 0 40px 0',
                                    border: '1px solid #222',
                                    maxHeight: '85vh',
                                    overflowY: 'auto'
                                }}
                            >
                                {/* Modal Handle */}
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
                                    <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#333' }} />
                                </div>

                                {/* Modal Header */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '16px 20px', borderBottom: '1px solid #1a1a1a'
                                }}>
                                    <span style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>Message Detail</span>
                                    <button
                                        onClick={() => setSelectedMsg(null)}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#888', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div style={{ padding: '24px 20px' }}>
                                    {/* Icon + Title */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                                            background: `${accent}15`, border: `1px solid ${accent}30`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '26px'
                                        }}>
                                            {emoji || <Bell size={24} color={accent} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '17px', fontWeight: '900', color: '#fff', lineHeight: '1.3' }}>
                                                {selectedMsg.title}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                                                {new Date(selectedMsg.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ borderTop: `1px solid ${accent}20`, marginBottom: '20px' }} />

                                    {/* Message Body */}
                                    <div style={{
                                        fontSize: '14px', color: '#ccc', lineHeight: '1.8',
                                        backgroundColor: `${accent}06`,
                                        padding: '16px', borderRadius: '12px',
                                        border: `1px solid ${accent}15`
                                    }}>
                                        {selectedMsg.description}
                                    </div>

                                    {/* Attachments */}
                                    {(selectedMsg.replyImage || selectedMsg.replyImages) && (
                                        <div style={{ marginTop: '20px' }}>
                                            <div style={{ fontSize: '12px', color: '#555', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                                Attachments
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {[...(selectedMsg.replyImages || []), ...(selectedMsg.replyImage ? [selectedMsg.replyImage] : [])].map((img, i) => (
                                                    <img
                                                        key={i}
                                                        src={img}
                                                        alt="Attachment"
                                                        onClick={() => setSelectedImg(img)}
                                                        style={{ width: '90px', height: '90px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #333', cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedMsg(null)}
                                        style={{
                                            marginTop: '28px', width: '100%', padding: '14px',
                                            backgroundColor: '#1a1a1a', color: '#888',
                                            border: '1px solid #222', borderRadius: '12px',
                                            fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* Image Fullscreen Modal */}
            <AnimatePresence>
                {selectedImg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImg(null)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 3000,
                            backgroundColor: 'rgba(0,0,0,0.97)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            src={selectedImg}
                            alt="Full View"
                            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
                        />
                        <button
                            onClick={() => setSelectedImg(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Messages;
