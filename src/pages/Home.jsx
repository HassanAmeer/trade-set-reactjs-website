import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { db } from '../firebase-setup';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
    CreditCard, Wallet, ArrowRightLeft, Headphones, Volume2, Menu, Mail, Zap,
    Newspaper
} from 'lucide-react';
import heroImage from '../assets/hero.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { assets, loading: marketLoading } = useMarket();
    const [activeTab, setActiveTab] = useState('All');
    const [banners, setBanners] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'carousel'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBanners(list);
        });
        return () => unsubscribe();
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
                    <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={20} fill="var(--accent-gold)" /> Bitop
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Mail size={22} color="var(--text-primary)" onClick={() => navigate('/inbox')} style={{ cursor: 'pointer' }} />
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
                <div className="action-item" onClick={() => navigate('/deposit')}>
                    <div className="action-icon"><CreditCard size={20} className='shimmer-icon' /></div>
                    <span className="action-label">Deposit</span>
                </div>
                <div className="action-item" onClick={() => navigate('/withdrawal')}>
                    <div className="action-icon"><Wallet size={20} /></div>
                    <span className="action-label">Withdrawal</span>
                </div>

                <div className="action-item" onClick={() => navigate('/support')}>
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
                            <div key={coin.id} className="trending-card" onClick={() => navigate('/trade')}>
                                <img src={coin.flag} alt={coin.name} className="trending-icon" />
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
                                onClick={() => navigate('/trade')}
                            >
                                <div className="asset-info">
                                    <img src={asset.flag} alt={asset.name} className="asset-flag" />
                                    <span className="asset-name">{asset.name}</span>
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
        </motion.div>
    );
};

export default Home;
