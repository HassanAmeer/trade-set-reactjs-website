import React, { useState, useEffect } from 'react';
import { db } from '../firebase-setup';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Mail, MessageSquare, Phone, ExternalLink, Zap, Star, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const P2P = () => {
    const navigate = useNavigate();
    const [exchangers, setExchangers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [announceText, setAnnounceText] = useState('');
    const [announceActive, setAnnounceActive] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'admin_set', 'p2p_config'), (docSnap) => {
            if (docSnap.exists()) {
                setAnnounceText(docSnap.data().announcementText || '');
                setAnnounceActive(docSnap.data().announcementActive || false);
            }
        }, (error) => {
            console.error("Error loading announcement banner:", error);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Query to only fetch visible exchangers
        const q = query(collection(db, 'p2p_exchangers'), where('visible', '!=', false));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            // Filter out any entries that might have been visible: false but returned due to query filters
            const activeList = list.filter(item => item.visible !== false);

            // Sort: Trusted first, then by trust ratio desc
            activeList.sort((a, b) => {
                if (a.isTrusted && !b.isTrusted) return -1;
                if (!a.isTrusted && b.isTrusted) return 1;
                return Number(b.trustRatio || 0) - Number(a.trustRatio || 0);
            });

            setExchangers(activeList);
            setLoading(false);
        }, (error) => {
            console.error("Error loading exchangers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper to format contact link
    const getContactLink = (phoneVal) => {
        if (!phoneVal) return null;
        const cleaned = phoneVal.trim();
        if (cleaned.startsWith('@')) {
            // Telegram handle
            return `https://t.me/${cleaned.substring(1)}`;
        }
        if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
            // Direct URL
            return cleaned;
        }
        // Standard phone number
        // Clean non-numeric characters for WhatsApp link
        const numericOnly = cleaned.replace(/[^0-9]/g, '');
        if (numericOnly.length >= 7) {
            return `https://wa.me/${numericOnly}`;
        }
        return `tel:${cleaned}`;
    };

    const isTelegram = (phoneVal) => {
        return phoneVal && phoneVal.trim().startsWith('@');
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="app-container"
            style={{
                minHeight: '100vh',
                background: 'var(--bg-primary, #0a0a0a)',
                padding: '0 0 100px 0',
                color: '#fff',
                fontFamily: 'Inter, sans-serif'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <ChevronLeft 
                    size={24} 
                    onClick={() => navigate(-1)} 
                    style={{ cursor: 'pointer', color: 'var(--text-primary, #fff)' }} 
                />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '800', marginRight: '24px', margin: 0, letterSpacing: '0.5px' }}>
                    P2P Merchants
                </h1>
            </div>

            {/* Announcement Banner */}
            <AnimatePresence>
                {announceActive && announceText && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        style={{ padding: '16px 16px 0 16px' }}
                    >
                        <motion.div
                            animate={{
                                borderColor: [
                                    'rgba(240, 185, 11, 0.25)',
                                    'rgba(240, 185, 11, 0.6)',
                                    'rgba(240, 185, 11, 0.25)'
                                ],
                                boxShadow: [
                                    '0 4px 12px rgba(240, 185, 11, 0.15)',
                                    '0 4px 22px rgba(240, 185, 11, 0.35)',
                                    '0 4px 12px rgba(240, 185, 11, 0.15)'
                                ]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                padding: '14px 16px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.12) 0%, rgba(240, 185, 11, 0.03) 100%)',
                                border: '1px solid rgba(240, 185, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            <Megaphone size={18} color="#f0b90b" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', color: '#f0b90b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                    Notice / Announcement
                                </div>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#fff', fontWeight: '500', lineHeight: '1.4' }}>
                                    {announceText}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sub-Header Notice */}
            <div style={{ padding: '12px 16px 4px 16px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#777', lineHeight: '1.6', textAlign: 'center' }}>
                    Deal with trusted exchangers for deposits and withdrawals. Contact them directly via Email, WhatsApp, or Telegram. Always check trust ratios before initiating a trade.
                </p>
            </div>

            {/* Exchangers List */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {loading ? (
                    // Skeleton Loaders
                    [1, 2, 3].map(i => (
                        <div key={i} className="skeleton-loader" style={{ width: '100%', height: '170px', borderRadius: '18px' }}></div>
                    ))
                ) : exchangers.length > 0 ? (
                    <AnimatePresence>
                        {exchangers.map((item, index) => {
                            const contactUrl = getContactLink(item.phone);
                            const isTg = isTelegram(item.phone);

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass"
                                    style={{
                                        borderRadius: '18px',
                                        padding: '20px',
                                        border: item.isTrusted ? '1px solid rgba(240, 185, 11, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                        background: item.isTrusted 
                                            ? 'linear-gradient(135deg, rgba(240,185,11,0.04) 0%, rgba(0,0,0,0.6) 100%)' 
                                            : 'rgba(255,255,255,0.02)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {/* Top Profile Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '45px',
                                                height: '45px',
                                                borderRadius: '50%',
                                                backgroundColor: item.isTrusted ? 'rgba(240,185,11,0.1)' : 'rgba(255,255,255,0.05)',
                                                border: `2px solid ${item.isTrusted ? 'var(--accent-gold, #f0b90b)' : 'rgba(255,255,255,0.1)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '800',
                                                fontSize: '18px',
                                                color: item.isTrusted ? 'var(--accent-gold, #f0b90b)' : '#fff'
                                            }}>
                                                {(item.name || 'M')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '15px' }}>
                                                    {item.name}
                                                    {item.isTrusted && <ShieldCheck size={16} color="var(--accent-gold, #f0b90b)" fill="rgba(240,185,11,0.2)" />}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <span style={{
                                                        fontSize: '9px',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        backgroundColor: item.isTrusted ? 'rgba(240,185,11,0.15)' : 'rgba(255,255,255,0.06)',
                                                        color: item.isTrusted ? 'var(--accent-gold, #f0b90b)' : '#888',
                                                        fontWeight: '700',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {item.isTrusted ? 'Verified Partner' : 'Exchanger'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trust ratio score */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trust Score</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                <Star size={12} color="#f0b90b" fill="#f0b90b" />
                                                <span style={{ fontSize: '14px', fontWeight: '900', color: '#00c087' }}>{item.trustRatio}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Methods */}
                                    <div style={{ marginBottom: '18px' }}>
                                        <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px', letterSpacing: '0.5px' }}>Accepting methods</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {item.methods && item.methods.length > 0 ? (
                                                item.methods.map((method, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            fontSize: '11px',
                                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                                            color: '#fff',
                                                            border: '1px solid rgba(255,255,255,0.06)',
                                                            padding: '4px 10px',
                                                            borderRadius: '8px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {method}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#555' }}>Any method supported</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Buttons */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: item.email && contactUrl ? '1fr 1fr' : '1fr',
                                        gap: '10px',
                                        borderTop: '1px solid rgba(255,255,255,0.04)',
                                        paddingTop: '16px'
                                    }}>
                                        {item.email && (
                                            <a
                                                href={`mailto:${item.email}`}
                                                style={{
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    color: '#aaa',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    transition: 'all 0.25s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#aaa'; }}
                                            >
                                                <Mail size={16} /> Email Merchant
                                            </a>
                                        )}
                                        {contactUrl && (
                                            <a
                                                href={contactUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    backgroundColor: item.isTrusted ? 'rgba(240, 185, 11, 0.15)' : 'rgba(0, 192, 135, 0.15)',
                                                    border: `1px solid ${item.isTrusted ? 'rgba(240, 185, 11, 0.25)' : 'rgba(0, 192, 135, 0.25)'}`,
                                                    color: item.isTrusted ? 'var(--accent-gold, #f0b90b)' : '#00c087',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    transition: 'all 0.25s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                                            >
                                                {isTg ? <MessageSquare size={16} /> : <Phone size={16} />}
                                                {isTg ? 'Telegram Chat' : 'WhatsApp Chat'} <ExternalLink size={12} style={{ opacity: 0.7 }} />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                ) : (
                    <div style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '32px' }}>💼</span>
                        <div>No P2P Merchants are currently active. Please check back later.</div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default P2P;
