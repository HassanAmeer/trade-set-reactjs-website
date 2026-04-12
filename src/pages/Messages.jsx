import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Bell, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const Messages = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(null);

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
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(list);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 40px 0', color: '#fff' }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #222',
                background: 'var(--bg-primary)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>Inbox</h1>
            </div>

            <div style={{ padding: '0' }}>
                {loading && <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Loading...</div>}
                
                {!loading && messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            padding: '16px',
                            borderBottom: '1px solid #222',
                            display: 'flex',
                            gap: '12px',
                            background: 'transparent'
                        }}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(240, 185, 11, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-gold)'
                        }}>
                            {msg.type === 'alert' ? <Bell size={20} /> : <Info size={20} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '700' }}>{msg.title}</span>
                                <span style={{ fontSize: '11px', color: '#666' }}>
                                    {new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                                {msg.description}
                            </p>
                            {(msg.replyImage || msg.replyImages) && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                                    {[...(msg.replyImages || []), ...(msg.replyImage ? [msg.replyImage] : [])].map((img, i) => (
                                        <img 
                                            key={i}
                                            src={img} 
                                            alt="Admin Attachment" 
                                            onClick={() => setSelectedImg(img)}
                                            style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #333', cursor: 'pointer' }} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {!loading && messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#666' }}>
                        No messages found
                    </div>
                )}
            </div>

            {/* Modal for full screen image view */}
            <AnimatePresence>
                {selectedImg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImg(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
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
