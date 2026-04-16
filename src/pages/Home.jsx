import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { db } from '../firebase-setup';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import {
    CreditCard, Wallet, ArrowRightLeft, Headphones, Volume2, Menu, Mail, Zap,
    Newspaper,
    BellIcon
} from 'lucide-react';
import heroImage from '../assets/hero.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { LogOut, X, Info, Megaphone } from 'lucide-react';
import { doc } from 'firebase/firestore';

const Home = () => {
    const { assets, loading: marketLoading, setIsActive } = useMarket();
    const { websiteName, logoUrl } = useBranding();

    const renderFormattedText = (text) => {
        if (!text) return '';
        const parts = text.split(/(<[^>]*>)/g);
        return parts.map((part, index) => {
            const match = part.match(/<([^>]*)>/);
            if (match) {
                return (
                    <span key={index} style={{ color: '#00c087', fontWeight: '900' }}>
                        {match[1]}
                    </span>
                );
            }
            return part;
        });
    };
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('All');
    const [banners, setBanners] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [announcement, setAnnouncement] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showBottom, setShowBottom] = useState(false);
    const navigate = useNavigate();

    // Activate market data loading for Home page
    useEffect(() => {
        setIsActive(true);
        return () => setIsActive(false);
    }, [setIsActive]);

    // Listen for unread messages
    useEffect(() => {
        if (!user) { setUnreadCount(0); return; }
        const q = query(
            collection(db, 'users', user.id, 'messages'),
            where('read', '==', false)
        );
        const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
        return () => unsub();
    }, [user]);

    useEffect(() => {
        // Fetch Banners
        const q = query(collection(db, 'carousel'), orderBy('timestamp', 'desc'));
        const unsubscribeBanners = onSnapshot(q, (snapshot) => {
            setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribeBanners();
    }, []);

    // Fetch Announcement Settings
    useEffect(() => {
        const announceRef = doc(db, 'admin_set', 'announcement');
        const unsub = onSnapshot(announceRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setAnnouncement(data);
                if (data.bottomActive) setShowBottom(true);
                if (data.popupActive) setShowPopup(true);
            }
        });
        return () => unsub();
    }, []);

    // Auto-cycling for banners
    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBannerIndex(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners]);

    const filteredAssets = assets.filter(a => {
        if (activeTab === 'All') return true;
        return a.category?.toLowerCase() === activeTab.toLowerCase();
    });

    const trendingCoins = assets.filter(a => a.category === 'Cryptocurrency').slice(0, 5);

    const renderSkeleton = () => (
        <div className="asset-list">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="asset-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="asset-info">
                        <div className="skeleton-loader" style={{ width: '24px', height: '24px', borderRadius: '50%' }}></div>
                        <div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div>
                    </div>
                    <div className="skeleton-loader" style={{ width: '60px', height: '16px' }}></div>
                    <div style={{ justifySelf: 'end' }}>
                        <div className="skeleton-loader" style={{ width: '70px', height: '32px', borderRadius: '6px' }}></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-container"
        >
            <div className="flex-between" style={{ marginBottom: '16px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" style={{ height: '24px', width: 'auto' }} />
                        ) : (
                            <Zap size={20} fill="var(--accent-gold)" />
                        )}
                        {websiteName}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/inbox')}>
                        <BellIcon size={22} color="var(--text-primary)" />
                        {unreadCount > 0 && (
                            <div style={{
                                position: 'absolute', top: '-6px', right: '-6px',
                                backgroundColor: '#ff4d4f', color: '#fff',
                                fontSize: '9px', fontWeight: '900',
                                width: '16px', height: '16px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid var(--bg-primary)'
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </div>
                    {user && (
                        <LogOut
                            size={22}
                            color="#ff4d4f"
                            onClick={() => setShowLogoutConfirm(true)}
                            style={{ cursor: 'pointer', marginTop: '-8px' }}
                        />
                    )}
                </div>
            </div>

            {/* Hero Carousel */}
            <div className="hero-container" style={{ position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    {banners.length > 0 ? (
                        <motion.div
                            key={banners[currentBannerIndex]?.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            style={{ width: '100%', height: '100%', position: 'absolute' }}
                        >
                            <img
                                src={banners[currentBannerIndex]?.imageUrl}
                                alt="Banner"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {(banners[currentBannerIndex]?.title || banners[currentBannerIndex]?.description) && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '20px',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                    color: '#fff'
                                }}>
                                    {banners[currentBannerIndex]?.title && (
                                        <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 5px 0' }}>{banners[currentBannerIndex].title}</h2>
                                    )}
                                    {banners[currentBannerIndex]?.description && (
                                        <p style={{ fontSize: '12px', color: '#ccc', margin: 0 }}>{banners[currentBannerIndex].description}</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div style={{ width: '100%', height: '100%' }}>
                            <img src={heroImage} alt="Static Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div className="hero-overlay"></div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Dots indicator */}
                {banners.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '10px', right: '15px', display: 'flex', gap: '6px', zIndex: 10 }}>
                        {banners.map((_, i) => (
                            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentBannerIndex ? 'var(--accent-gold)' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
                        ))}
                    </div>
                )}
            </div>

            {/* <div className="flex-between" style={{ marginBottom: '16px', padding: '0 4px', marginTop: '15px' }}>
                <Volume2 size={20} color="var(--accent-gold)" />
                <Newspaper size={24} className='shimmer-icon' onClick={() => navigate('/news')} style={{ cursor: 'pointer' }} />
            </div> */}

            <div className="action-grid">
                <div className="action-item" onClick={() => user ? navigate('/deposit') : navigate('/login')}>
                    <div className="action-icon"><CreditCard size={20} className='shimmer-icon' /></div>
                    <span className="action-label">Deposit</span>
                </div>
                <div className="action-item" onClick={() => user ? navigate('/withdrawal') : navigate('/login')}>
                    <div className="action-icon"><Wallet size={20} /></div>
                    <span className="action-label">Withdrawal</span>
                </div>

                <div className="action-item" onClick={() => user ? navigate('/support') : navigate('/login')}>
                    <div className="action-icon"><Headphones size={20} /></div>
                    <span className="action-label">Customer service</span>
                </div>
                <div className="action-item" onClick={() => navigate('/news')}>
                    <div className="action-icon"><Newspaper size={20} /></div>
                    <span className="action-label">News</span>
                </div>
            </div>

            <div style={{ marginBottom: '12px', padding: '0 4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Trending Markets</h3>
                <div className="trending-coins">
                    {marketLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="trending-card">
                                <div className="skeleton-loader" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                                <div className="skeleton-loader" style={{ width: '60px', height: '14px' }}></div>
                                <div className="skeleton-loader" style={{ width: '80px', height: '18px' }}></div>
                                <div className="skeleton-loader" style={{ width: '40px', height: '12px' }}></div>
                            </div>
                        ))
                    ) : (
                        trendingCoins.map(coin => (
                            <div key={coin.id} className="trending-card" onClick={() => navigate('/trade', { state: { assetId: coin.id } })}>
                                <img
                                    src={coin.flag}
                                    alt={coin.name}
                                    className="trending-icon"
                                    onError={(e) => {
                                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/25/25254.png'; // Generic fallback
                                    }}
                                />
                                <span className="trending-symbol">{coin.symbol}</span>
                                <span className="trending-price">${coin.rate}</span>
                                <span className="trending-change" style={{ color: coin.change.startsWith('+') ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                    {coin.change}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="asset-tabs" style={{ overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                {['All', 'Foreign Exchange', 'Cryptocurrency', 'Precious Metals'].map(tab => (
                    <div
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            {marketLoading ? renderSkeleton() : (
                <div className="asset-list">
                    <div className="asset-header">
                        <span>Currency</span>
                        <span>Price</span>
                        <span style={{ textAlign: 'center' }}>Change in 1m</span>
                    </div>

                    {filteredAssets.length > 0 ? filteredAssets.slice(0, 30).map((asset, index) => {
                        const isUp = asset.change.startsWith('+');
                        return (
                            <motion.div
                                layout
                                key={asset.id}
                                className="asset-row"
                                style={{ '--index': index }}
                                onClick={() => navigate('/trade', { state: { assetId: asset.id } })}
                            >
                                <div className="asset-info">
                                    <img
                                        src={asset.flag}
                                        alt={asset.name}
                                        className="asset-flag"
                                        onError={(e) => {
                                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/25/25254.png';
                                        }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="asset-name" style={{ marginBottom: '2px' }}>{asset.name}</span>
                                        {asset.fullName && (
                                            <span style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>{asset.fullName}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="asset-rate">{asset.rate}</div>
                                <div style={{ justifySelf: 'end' }}>
                                    <div className={`rate-btn ${isUp ? 'rate-up' : 'rate-down'}`}>
                                        {asset.change}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                            No data available for this category
                        </div>
                    )}
                </div>
            )}

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                                borderRadius: '24px',
                                padding: '30px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                textAlign: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 77, 79, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: '#ff4d4f',
                                border: '1px solid rgba(255, 77, 79, 0.2)'
                            }}>
                                <LogOut size={28} />
                            </div>
                            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Sign Out?</h3>
                            <p style={{ color: '#888', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>Are you sure you want to log out of your account?</p>

                            <div style={{ display: 'grid', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowLogoutConfirm(false);
                                    }}
                                    style={{
                                        padding: '14px',
                                        backgroundColor: '#ff4d4f',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Yes, Log Out
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    style={{
                                        padding: '14px',
                                        backgroundColor: 'transparent',
                                        color: '#666',
                                        border: '1px solid #222',
                                        borderRadius: '14px',
                                        fontWeight: '600',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Announcement System: Popup Type */}
            <AnimatePresence>
                {showPopup && announcement?.popupActive && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPopup(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className='shimmer-icon'
                            style={{
                                width: '100%',
                                maxWidth: '360px',
                                background: '#111',
                                borderRadius: '25px',
                                overflow: 'hidden',
                                position: 'relative',
                                border: '1px solid #00C0865D',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                            }}
                        >
                            <button
                                onClick={() => setShowPopup(false)}
                                style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={18} />
                            </button>

                            {announcement.popupImage && (
                                <img src={announcement.popupImage} alt="Announcement" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            )}

                            <div style={{ padding: '25px', textAlign: 'center' }}>
                                {announcement.popupTitle && (
                                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
                                        {announcement.popupTitle}
                                    </h2>
                                )}
                                {announcement.popupDescription && (
                                    <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.6', margin: 0 }}>
                                        {renderFormattedText(announcement.popupDescription)}
                                    </p>
                                )}


                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Announcement System: Bottom Bar Type */}
            <AnimatePresence>
                {showBottom && announcement?.bottomActive && (
                    <motion.div
                        initial={{ y: 100, x: '-50%', opacity: 0 }}
                        animate={{ y: 0, x: '-50%', opacity: 1 }}
                        exit={{ y: 100, x: '-50%', opacity: 0 }}
                        style={{
                            position: 'fixed',
                            bottom: '65px', // Exactly touching the bottom nav height
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '100%',
                            maxWidth: '480px',
                            zIndex: 8000,
                            background: 'rgba(15,15,15,0.95)',
                            backdropFilter: 'blur(20px)',
                            padding: '12px 15px',
                            borderTop: '1px solid rgba(240,185,11,0.2)',
                            boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <div className='shimmer-icon' style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(240,185,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Megaphone size={20} color="#f0b90b" />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h4
                                style={{ color: '#fff', fontSize: '14px', fontWeight: '900', margin: '0 0 2px 0' }}>
                                {announcement.barTitle}
                            </h4>
                            <p style={{ color: '#888', fontSize: '11px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {renderFormattedText(announcement.barSubtitle)}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowBottom(false)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#555', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Home;
