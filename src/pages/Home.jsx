import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import {
    CreditCard, Wallet, ArrowRightLeft, Headphones, Volume2, Menu, Mail, Zap
} from 'lucide-react';
import heroImage from '../assets/hero.png';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { assets, loading } = useMarket();
    const [activeTab, setActiveTab] = useState('All');
    const navigate = useNavigate();

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

            <div className="hero-container">
                <img src={heroImage} alt="Trading Hero" className="hero-image" />
                <div className="hero-overlay"></div>
            </div>

            <div className="flex-between" style={{ marginBottom: '16px', padding: '0 4px' }}>
                <Volume2 size={20} color="var(--accent-gold)" />
                <Menu size={24} color="var(--text-primary)" onClick={() => navigate('/news')} style={{ cursor: 'pointer' }} />
            </div>

            <div className="action-grid">
                <div className="action-item" onClick={() => navigate('/deposit')}>
                    <div className="action-icon"><CreditCard size={20} /></div>
                    <span className="action-label">Deposit</span>
                </div>
                <div className="action-item" onClick={() => navigate('/withdrawal')}>
                    <div className="action-icon"><Wallet size={20} /></div>
                    <span className="action-label">Withdrawal</span>
                </div>
                <div className="action-item" onClick={() => navigate('/c2c')}>
                    <div className="action-icon"><ArrowRightLeft size={20} /></div>
                    <span className="action-label">C2C</span>
                </div>
                <div className="action-item" onClick={() => navigate('/support')}>
                    <div className="action-icon"><Headphones size={20} /></div>
                    <span className="action-label">Customer service</span>
                </div>
            </div>

            <div style={{ marginBottom: '12px', padding: '0 4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Trending Markets</h3>
                <div className="trending-coins">
                    {loading ? (
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

            {loading ? renderSkeleton() : (
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
